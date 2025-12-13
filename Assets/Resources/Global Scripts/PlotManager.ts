import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import CropManager from "./CropManager";
import { Game } from "@Easy/Core/Shared/Game";
import CropTile from "Resources/Land/CropTile";
import PlotScript from "Resources/Land/PlotScript";
import { Airship } from "@Easy/Core/Shared/Airship";
import { Player } from "@Easy/Core/Shared/Player/Player";
import PlayerManager from "./PlayerManager";
import { ItemStack } from "@Easy/Core/Shared/Inventory/ItemStack";
import { getPlantSeedName, getPlantName, getPlant, Plants } from "./PlantList"

export default class PlotManager extends AirshipSingleton {

	public Plots: GameObject[] = [];
	private serverPlotData: String[] = [];
	private serverPlayerData: Record<string, boolean> = {};

	// SIGNALS
	private SIGNAL_LOAD_LAND = new NetworkSignal<{data: String, plotIndex: number, name: string, id: string}>("LOAD_LAND");
	private CLAIM_PLOT_SIGNAL = new NetworkSignal<{plotIndex: number, playerName: string}>("CLAIM_PLOT");
	private GET_ITEM_SIGNAL = new NetworkSignal<{item: string, playerName: string, itemName: string}>("GET_ITEM");

	private CLICK_DIRT_SIGNAL = new NetworkSignal<{
		plotIndex: number,
		cx: number,
		cy: number,
		x: number,
		y: number,
		itemType: string,
		item: string,
		playerName: string}>
		("CLICK_DIRT");

	private CROP_SIGNAL = new NetworkSignal<{plotIndex: number, cx: number, cy: number, x: number, y: number, crop: string[]}>("CROP");
	private CROP_FINISH_SIGNAL = new NetworkSignal<{plotIndex: number, cx: number, cy: number, x: number, y: number, crop: string[]}>("CROP_FINISH");

	private SYNC_LANDS_SIGNAL = new NetworkSignal<{data: String, plotIndex: number, name: string, id: string}>("SYNC_LANDS");

	override Start(): void {
		// -- SERVER --
		if (Game.IsServer()) {
			print("SERVER: PlotManager initialized.");

			this.ConnectServerSignals();
			this.InitializePlots();
		}

		// -- CLIENT --
		if (Game.IsClient()) {
			print("CLIENT: PlotManager initialized.");
			
			this.ConnectClientSignals();
			this.LoadLand("NEW");
		}
	}

	override Update(dt: number): void {
		if (Game.IsServer()) {
			this.updatePlots(dt);
		}
	}

	public LoadLand(data: String): void {
		if (Game.IsServer()) {

		}
		
		if (Game.IsClient()) {
			
		}
	}

	@Client()
	public AskToClaimPlot(plotIndex: number): void {
		print("CLIENT: Sending signal to claim plot.");
		this.CLAIM_PLOT_SIGNAL.client.FireServer({plotIndex: plotIndex, playerName: Game.localPlayer.username});
	}

	@Server()
	private InitializePlots(): void {
		// Initialize plots.

		for (let i = 0; i < this.Plots.size(); i++) {
			print("PlotManager: Initializing plot #" + i + "...");

			const plot = this.Plots[i];

			// Initialize plot.
			let data: String = "";

			data = this.emptyLandData();

			this.serverPlotData[i] = json.encode({data: data, plotIndex: i + 1, isFree: true, name: "none"});

			print("PlotManager: Plot #" + i + " initialized with next index: " + (i + 1));
			print(i, this.serverPlotData[i]);
		}
	}

	@Server()
	emptyLandData(): String {
		// Create an empty land.
		let landData: String[][][][] = [];

		for (let cx = 0; cx <= 1; cx++) {
			landData[cx] = [];
			for (let cy = 0; cy <= 1; cy++) {
				landData[cx][cy] = [];
				for (let x = 0; x < 5; x++) {
					landData[cx][cy][x] = [];
					for (let y = 0; y < 5; y++) {
						let dat = ["locked", "notDigged", "none", 0];

						if (cx === 0 && cy === 0) {
							dat = ["unlocked", "notDigged", "none", 0];
						}

						const textData = json.encode(dat);

						landData[cx][cy][x][y] = textData;
					}
				}
			}
		}

		return json.encode(landData);
	}

	@Client()
	public SetUpLand(data: String, plotIndex: number, name: string, id: string, isFree: boolean = false): void {
		if (isFree) {
			print("CLIENT: Land #" + plotIndex + " is free, doing nothing.");

			return;
		}
		print("CLIENT: Setting up land for player " + name + ".");
		//print("CLIENT: Data: " + data);

		let landData: String[][][][] = json.decode(tostring(data));
		//print("TEST: " + json.encode(landData));
		let land = this.Plots[plotIndex];

		if (land === undefined) {
			print("CLIENT: Land " + plotIndex + " does not exist.");

			return;
		}
		land.transform.Find("ClaimSound").gameObject.GetComponent<AudioSource>()!.Play();

		if (name === Game.localPlayer.username || name === Game.localPlayer.userId) {
			PlayerManager.Get().setPlayerPlotIndex(plotIndex);
		}

		//get plot script
		const plotScript = land.GetAirshipComponent<PlotScript>();
		plotScript?.setOwner(name, id);

		for (let cx = 0; cx <= 1; cx++) {
			for (let cy = 0; cy <= 1; cy++) {
				for (let x = 0; x < 5; x++) {
					for (let y = 0; y < 5; y++) {
						const crop = json.decode(tostring(landData[cx][cy][x][y])) as string[] || {};
						const dirtChunk = land.transform.Find("Dirt_" + cx + "_" + cy);
						const dirt = dirtChunk.transform.Find("CropTile_" + x + "_" + y);
						
						const dirtScript = dirt?.gameObject.GetAirshipComponent<CropTile>();

						dirtScript?.init(plotIndex, cx, cy, x, y);
						dirtScript?._UPDATE(false, crop[1], !(crop[0] === "locked"));
					}
				}
			}
		}
	}

	@Server()
	public clickDirt(plotIndex: number, cx: number, cy: number, x: number, y: number, itemType: string, playerName: string): void {
		if (Game.IsServer()) {
			// check if player clicked same plot that he already owns
			const plotData = json.decode(tostring(this.serverPlotData[plotIndex])) as {data: String, plotIndex: number, isFree: boolean, name: string};
			const name = plotData.name;
			if (name === playerName) {
				print("SERVER: Player " + playerName + " owns plot #" + plotIndex + ".");
			}

			this.CLICK_DIRT_SIGNAL.server.FireAllClients({
				plotIndex: plotIndex,
				cx: cx,
				cy: cy,
				x: x,
				y: y,
				itemType: itemType,
				item: "none",
				playerName: playerName
			});

			// update crop data on server

			const decodedData = json.decode(tostring(plotData.data)) as String[][][][];
			const crop = json.decode(tostring(decodedData[cx][cy][x][y])) as string[] || {};
			const isDigged = crop[1]
			const isUnlocked = crop[0]

			print("Crop data: [" + crop[0] + ", " + crop[1] + ", " + crop[2] + ", " + crop[3] + "]");

			if (itemType === "Hoe" && isDigged === "notDigged" && isUnlocked === "unlocked") {
				if (crop[2] === "none") {
					crop[1] = "digged";
					//print("SERVER: Made crop digged at plot #" + plotIndex + " at (" + cx + ", " + cy + ") at (" + x + ", " + y + ").");

					decodedData[cx][cy][x][y] = json.encode(crop);
					plotData.data = json.encode(decodedData);

					this.serverPlotData[plotIndex] = json.encode(plotData);
				} else {
					print("SERVER: Plot #" + plotIndex + " at (" + cx + ", " + cy + ") at (" + x + ", " + y + ") already has a crop with grow time: " + crop[3]);

					// check if crop already grew fully
					if (crop[3] === "-1") {
						print("SERVER: Crop at plot #" + plotIndex + " at (" + cx + ", " + cy + ") at (" + x + ", " + y + ") has already grown fully.");
					} else {
						// if it hasn't, do nothing.

						return;
					}

					// remove crop, add randomized item in inventory

					// find player that sent signal
					print("Player " + playerName + " sent signal to get item: " + crop[2]);
					const itemName = PlayerManager.Get().generateRandomWeight(crop[2]);
					this.GET_ITEM_SIGNAL.server.FireAllClients({item: crop[2], playerName: playerName, itemName: itemName});

					crop[1] = "notDigged";
					crop[2] = "none";
					crop[3] = "0";

					decodedData[cx][cy][x][y] = json.encode(crop);
					plotData.data = json.encode(decodedData);

					this.serverPlotData[plotIndex] = json.encode(plotData);

					this.sendCropSignal(plotIndex, cx, cy, x, y, [crop[0], crop[1], crop[2], crop[3]]);
				}
			}

			const isSeed = (string.match(itemType, "Seed$"));
			const isSeedCheck = (isSeed as string[])[0] === "Seed";

			if (isDigged === "digged" && isUnlocked === "unlocked" && isSeedCheck) {
				crop[1] = "notDigged";

				const cropName = getPlantName(itemType);
				print("SERVER: Got " + cropName + " seed at plot #" + plotIndex + " at (" + cx + ", " + cy + ") at (" + x + ", " + y + ").");
				crop[2] = cropName;
				crop[3] = tostring(getPlant(cropName)!.growTime); // crop time to grow

				Airship.Characters.ObserveCharacters((character) => {
					if (character.player?.userId === playerName) {
						character.inventory?.Decrement(itemType, 1);
					}
				});

				decodedData[cx][cy][x][y] = json.encode(crop);
				plotData.data = json.encode(decodedData);

				this.serverPlotData[plotIndex] = json.encode(plotData);

				this.sendCropSignal(plotIndex, cx, cy, x, y, [crop[0], crop[1], cropName, crop[3]]);
			}
		}
	}

	@Client()
	public sendDirtSignal(plotIndex: number, cx: number, cy: number, x: number, y: number, itemType: string, crop: string, playerName: string): void {
		if (Game.IsClient()) {
			// check if player is plot owner
			const plotOwner = this.Plots[plotIndex].GetAirshipComponent<PlotScript>()?.getOwnerId();
			print("Got playername: " + playerName + " and plot owner: " + plotOwner);
			if (plotOwner === playerName) {
				print("CLIENT: Player " + playerName + " owns plot #" + plotIndex + ".");
				
				this.CLICK_DIRT_SIGNAL.client.FireServer({
					plotIndex: plotIndex,
					cx: cx,
					cy: cy,
					x: x,
					y: y, 
					itemType: itemType,
					item: crop,
					playerName: playerName
				});
			}
		}
	}

	@Server()
	public sendCropSignal(plotIndex: number, cx: number, cy: number, x: number, y: number, crop: string[]): void {
		if (Game.IsServer()) {
			this.CROP_SIGNAL.server.FireAllClients({
				plotIndex: plotIndex,
				cx: cx,
				cy: cy,
				x: x,
				y: y,
				crop: crop
			});
		}
	}

	@Server()
	public sendSyncLandsSignal(player: Player): void {
		if (Game.IsServer()) {
			for (let i = 0; i < this.Plots.size(); i++) {
				const plotData = json.decode(tostring(this.serverPlotData[i])) as {data: String, plotIndex: number, isFree: boolean, name: string};
				const decodedData = json.decode(tostring(plotData.data)) as String[][][][];

				this.SYNC_LANDS_SIGNAL.server.FireClient(player, {data: json.encode(decodedData), plotIndex: plotData.plotIndex, name: plotData.name, id: plotData.name});
			}
		}
	}

	@Server()
	public ConnectServerSignals(): void {
		// -- SERVER --

		this.SIGNAL_LOAD_LAND.server.OnClientEvent((player, data) => {
			print("SERVER: CropManager received signal.");
			print("SERVER: Data: " + data.data);

			// TODO: Right now i am ignoring the fact that there's few lands in the game.
			if (data.data === "NEW") {
				// Create an empty land.
				let landData: String[][][][] = [];

				for (let cx = 0; cx <= 1; cx++) {
					landData[cx] = [];
					for (let cy = 0; cy <= 1; cy++) {
						landData[cx][cy] = [];
						for (let x = 0; x < 5; x++) {
							landData[cx][cy][x] = [];
							for (let y = 0; y < 5; y++) {
								const dat = ["null", "something"];
								const d = dat[math.random(0, 1)]
								const textData = json.encode(d);

								landData[cx][cy][x][y] = textData;
							}
						}
					}
				}

				print("SERVER: Land data: " + json.encode(landData));
				this.SIGNAL_LOAD_LAND.server.FireClient(player, {data: json.encode(landData), plotIndex: data.plotIndex, name: data.name, id: player.userId});
			}
		});

		this.CLAIM_PLOT_SIGNAL.server.OnClientEvent((player, data) => {
            print("SERVER: Player " + player.userId + " wants to claim a plot, checking if it's available...");

            // Check if plot is available.
            const plotData = this.serverPlotData[data.plotIndex];
			if (plotData === undefined) {
				print("SERVER: Plot data is undefined.");

				return;
			}

			const plot = json.decode(tostring(plotData)) as {data: String, plotIndex: number, isFree: boolean};

			if (plot) {
				// WHAT THE ACTUAL FUCK IS THAT
				if (this.serverPlayerData[player.userId]) {
					print("SERVER: Player " + player.userId + " is already claimed a plot.");

					return;
				}
				this.serverPlayerData[player.userId] = true;

				if (plot.isFree) {
					print("SERVER: Plot is available, claiming it...");

					// Claim plot.
					data.name = player.userId;
					this.serverPlotData[data.plotIndex] = json.encode({data: plot.data, plotIndex: data.plotIndex, isFree: false, name: player.userId});
					this.SIGNAL_LOAD_LAND.server.FireAllClients({data: plot.data, plotIndex: data.plotIndex, name: player.username, id: player.userId});
					this.CLAIM_PLOT_SIGNAL.server.FireAllClients({plotIndex: data.plotIndex, playerName: player.username});
				} else {
					print("SERVER: Plot is already claimed.");
				}
			}
        });

		this.CLICK_DIRT_SIGNAL.server.OnClientEvent((player, data) => {
			print("SERVER: Player " + player.userId + " clicked dirt at plot #" + data.plotIndex + " at (" + data.cx + ", " + data.cy + ") at (" + data.x + ", " + data.y + ").");

			this.clickDirt(data.plotIndex, data.cx, data.cy, data.x, data.y, data.itemType, player.userId);
		});
	}

	@Client()
	public ConnectClientSignals(): void {
		// -- CLIENT --

		this.SIGNAL_LOAD_LAND.client.OnServerEvent((data) => {
			print("CLIENT: CropManager received signal.");
			print("CLIENT: Data: " + data.data);

			this.SetUpLand(data.data, data.plotIndex, data.name, data.id);
		});

		this.CLAIM_PLOT_SIGNAL.client.OnServerEvent((data) => {
			print("CLIENT: Player " + data.playerName + " claimed a plot #" + data.plotIndex);

			// disable collider for this plot
			const collider = this.Plots[data.plotIndex].GetComponent<BoxCollider>() as BoxCollider;
			collider.enabled = false;
		})

		this.CLICK_DIRT_SIGNAL.client.OnServerEvent((data) => {
			print("CLIENT: Player " + data.playerName + " clicked dirt at plot #" + data.plotIndex + " at (" + data.cx + ", " + data.cy + ") at (" + data.x + ", " + data.y + ").");

			CropManager.Get().clickDirt(
				data.plotIndex,
				tonumber(data.cx) || 0,
				tonumber(data.cy) || 0,
				tonumber(data.x) || 0,
				tonumber(data.y) || 0,
				data.itemType,
				data.item,
			)
		})

		this.CROP_SIGNAL.client.OnServerEvent((data) => {
			print("CLIENT: CropManager received crop signal.");
			
			CropManager.Get().setCrop(
				data.plotIndex,
				tonumber(data.cx) || 0,
				tonumber(data.cy) || 0,
				tonumber(data.x) || 0,
				tonumber(data.y) || 0,
				data.crop
			)
		})

		this.CROP_FINISH_SIGNAL.client.OnServerEvent((data) => {
			print("CLIENT: CropManager received crop finish signal.");

			CropManager.Get().setCropFinish(
				data.plotIndex,
				tonumber(data.cx) || 0,
				tonumber(data.cy) || 0,
				tonumber(data.x) || 0,
				tonumber(data.y) || 0,
				data.crop
			)
		})

		this.SYNC_LANDS_SIGNAL.client.OnServerEvent((data) => {
			if (data.name === "none"){
				this.SetUpLand(data.data, data.plotIndex-1, data.name, data.id, true);
			} else {
				this.SetUpLand(data.data, data.plotIndex-1, data.name, data.id);
			}
		})

		this.GET_ITEM_SIGNAL.client.OnServerEvent((data) => {
			PlayerManager.Get().registerNewInventoryItem(data.item, data.itemName);
			
			// give this item to the player
			Airship.Characters.ObserveCharacters((character) => {
				character.inventory?.AddItem(new ItemStack(data.itemName, 1));

				if (character.player?.userId !== data.playerName) {
					// remove item from inventory
					character.inventory?.Decrement(data.itemName, 1);
				}
			});

			print("Got item: " + data.item + " with name: " + data.itemName);
		})
	}

	private plotUpdateTimer = 0;
	@Server()
	private updatePlots(dt: number): void {
		this.plotUpdateTimer += dt;

		if (this.plotUpdateTimer >= 1) {
			this.plotUpdateTimer = 0;

			for (let i = 0; i < this.Plots.size(); i++) {
				const plotData = json.decode(tostring(this.serverPlotData[i])) as {data: String, plotIndex: number, isFree: boolean, name: string};
				const decodedData = json.decode(tostring(plotData.data)) as String[][][][];

				for (let cx = 0; cx <= 1; cx++) {
					for (let cy = 0; cy <= 1; cy++) {
						for (let x = 0; x < 5; x++) {
							for (let y = 0; y < 5; y++) {
								const crop = json.decode(tostring(decodedData[cx][cy][x][y])) as string[] || {};

								const plant = crop[2];

								if (plant !== "none") {
									let plantTime = crop[3]! || "0";
									const num = tonumber(plantTime) || 0;

									if (num > 0) {
										crop[3] = tostring(num - 1);
										
										print("Plot #" + i + " at (" + cx + ", " + cy + ") at (" + x + ", " + y + ") has plant: " + plant + " and time to grow: " + crop[3]);
									} else if (num === 0) {
										this.CROP_FINISH_SIGNAL.server.FireAllClients({plotIndex: i, cx: cx, cy: cy, x: x, y: y, crop: crop});

										crop[3] = "-1";
									}

									decodedData[cx][cy][x][y] = json.encode(crop);
									plotData.data = json.encode(decodedData);

									this.serverPlotData[i] = json.encode(plotData);
								}
							}
						}
					}
				} 
			}
		}
	}
}
