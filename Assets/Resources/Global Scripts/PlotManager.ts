import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import CropManager from "./CropManager";
import { Game } from "@Easy/Core/Shared/Game";

export default class PlotManager extends AirshipSingleton {

	public Plots: GameObject[] = [];
	private serverPlotData: String[] = [];

	// SIGNALS
	private SIGNAL_LOAD_LAND = new NetworkSignal<{data: String, plotIndex: number}>("LOAD_LAND");
	private CLAIM_PLOT_SIGNAL = new NetworkSignal<{plotIndex: number}>("CLAIM_PLOT");

	override Start(): void {
		// -- SERVER --
		if (Game.IsServer()) {
			print("SERVER: PlotManager initialized.");

			this.InitializePlots();
		}

		// -- CLIENT --
		if (Game.IsClient()) {
			print("CLIENT: PlotManager initialized.");
			
			this.ConnectClientSignals();
			this.LoadLand("NEW");
		}
	}

	public LoadLand(data: String): void {
		if (Game.IsServer()) {

		}
		
		if (Game.IsClient()) {
			//this.SIGNAL_LOAD_LAND.client.FireServer({data});
			this.SIGNAL_LOAD_LAND.client.FireServer({data: "NEW", plotIndex: 0});
		}
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

			this.serverPlotData[i] = json.encode({data: data, plotIndex: i, isFree: true});
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
						const dat = ["null"];
						const textData = json.encode(dat);

						landData[cx][cy][x][y] = textData;
					}
				}
			}
		}

		return json.encode(landData);
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

						//
					}
				}
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
				this.SIGNAL_LOAD_LAND.server.FireClient(player, {data: json.encode(landData), plotIndex: data.plotIndex});
			}
		});

		this.CLAIM_PLOT_SIGNAL.server.OnClientEvent((player, data) => {
            print("SERVER: Player " + player.userId + " wants to claim a plot, checking if it's available...");

            // Check if plot is available.
            const plotData = this.serverPlotData[data.plotIndex];
			const plot = json.decode(tostring(plotData)) as {data: String, plotIndex: number, isFree: boolean};

			if (plot) {
				if (plot.isFree) {
					print("SERVER: Plot is available, claiming it...");

					// Claim plot.
					this.serverPlotData[data.plotIndex] = json.encode({data: plot.data, plotIndex: data.plotIndex, isFree: false});
					this.SIGNAL_LOAD_LAND.server.FireClient(player, {data: plot.data, plotIndex: data.plotIndex});
				} else {
					print("SERVER: Plot is already claimed.");
				}
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

		this.CLAIM_PLOT_SIGNAL.client.OnServerEvent((data) => {
			print("CLIENT: You claimed a plot " + data.plotIndex);
		})
	}
}
