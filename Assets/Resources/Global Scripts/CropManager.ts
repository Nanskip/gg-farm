import { Game } from "@Easy/Core/Shared/Game";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import CropTile from "Resources/Land/CropTile";

export default class CropManager extends AirshipSingleton {
	// CropManager is a singleton that manages crops.
	// It is responsible for creating crops, updating them, and destroying them.
	// All the operations are done on the server and just syncing with the clients.

	// A signal to load new land on both sides.
	// On client called when player picks land, on server called when land is created and sends data to clients.

	// -- ADDITIONAL DESCRIPTION FROM GDD --
	// Manager that controls synchronization of crop tiles on suspected player's plot.
	// All actions that happens with crops are controlled via this manager.
	// Any action that player would do should be sent to server where it calculates needed data,
	// checks is action can be done (in case of any desync or internet issues) and then sends
	// callback to all clients to sync all the changes and also sends additional data to
	// current player (for example: when planting a crop, callback for other players would be just
	// crop appearing on tile, but the player that planted the crop would get additional data
	// about successful planting and removing crop from inventory.) **CropManager**
	// additionaly controlled with **PlotManager**.
	// -- END --

	public Plots: GameObject[] = [];

	private SIGNAL_LOAD_LAND = new NetworkSignal<{data: String, plotIndex: number}>("LOAD_LAND");

	override Start(): void {
		// -- SERVER --
		if (Game.IsServer()) {
			print("SERVER: CropManager initialized.");

			this.ConnectServerSignals();
		}

		// -- CLIENT --
		if (Game.IsClient()) {
			print("CLIENT: CropManager initialized.");
			
			this.ConnectClientSignals();
			this.LoadLand("NEW");
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
				this.SIGNAL_LOAD_LAND.server.FireClient(player, {data: json.encode(landData), plotIndex: data.plotIndex});
			}
		});
	}

	@Client()
	public ConnectClientSignals(): void {
		// -- CLIENT --

		this.SIGNAL_LOAD_LAND.client.OnServerEvent((data) => {
			print("CLIENT: CropManager received signal.");
			print("CLIENT: Data: " + data.data);

			this.SetUpLand(data.data, 0);
		});
	}

	public LoadLand(data: String): void {
		if (Game.IsServer()) {

		}
		
		if (Game.IsClient()) {
			//this.SIGNAL_LOAD_LAND.client.FireServer({data});
			this.SIGNAL_LOAD_LAND.client.FireServer({data: "NEW", plotIndex: 0});
		}
	}

	@Client()
	public SetUpLand(data: String, plotIndex: number): void {
		print("CLIENT: Setting up land for player.");
		//print("CLIENT: Data: " + data);

		// TODO: Right now i am ignoring the fact that there's few lands in the game.
		let landData: String[][][][] = json.decode(tostring(data));
		//print("TEST: " + json.encode(landData));
		let land = this.Plots[plotIndex];

		for (let cx = 0; cx <= 1; cx++) {
			for (let cy = 0; cy <= 1; cy++) {
				for (let x = 0; x < 5; x++) {
					for (let y = 0; y < 5; y++) {
						const crop = json.decode(tostring(landData[cx][cy][x][y])) || {};

						if (crop !== "null") {
							this.setTileHeight(land, true, "nothing?", x, y, cx, cy);
						} else {
							this.setTileHeight(land, false, "nothing!", x, y, cx, cy);
						}
					}
				}
			}
		}
	}


	// -- ADDITIONAL FOR CLIENT --

	@Client()
	public setTileHeight(land: GameObject, planted: boolean, _data: String, x: number = 0, y: number = 0, cx: number = 0, cy: number = 0): void {
		const dirt = land.transform.Find(`Dirt_${cx}_${cy}`);

		if (dirt) {
			//tile.transform.Find("CropTile").gameObject.GetAirshipComponent<CropTile>()
			const croptile = dirt.transform.Find(`CropTile_${y}_${x}`);

			if (croptile) {
				croptile.gameObject.GetAirshipComponent<CropTile>()?._UPDATE(planted, _data);
			}
		}
	}
}