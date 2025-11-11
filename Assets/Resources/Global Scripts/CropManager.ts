import { Game } from "@Easy/Core/Shared/Game";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class CropManager extends AirshipSingleton {
	// CropManager is a singleton that manages crops.
	// It is responsible for creating crops, updating them, and destroying them.
	// All the operations are done on the server and just syncing with the clients.

	// A signal to load new land on both sides.
	// On client called when player picks land, on server called when land is created and sends data to clients.
	private SIGNAL_LOAD_LAND = new NetworkSignal<{data: String}>("LOAD_LAND");

	override Start(): void {
		// -- SERVER --
		if (Game.IsServer()) {
			print("SERVER: CropManager initialized.");

			this.ConnectServerSignals();
		}

		// -- CLIENT --
		if (Game.IsClient()) {
			print("CLIENT: CropManager initialized.");
			
			this.LoadLand("NEW");
		}
	}

	public ConnectServerSignals(): void {
		this.SIGNAL_LOAD_LAND.server.OnClientEvent((player, data) => {
			print("SERVER: CropManager received signal.");
			print("SERVER: Data: " + data.data);

			// TODO: Right now i am ignoring the fact that there's few lands in the game.
			if (data.data === "NEW") {
				// Create an empty land.
				let landData: String[][] = [];

				for (let x = 0; x < 5; x++) {
					landData[x] = [];
					for (let y = 0; y < 5; y++) {
						const data = {crop: "null"};
						const textData = json.encode(data);

						landData[x][y] = textData;
					}
				}

				print("SERVER: Land data: " + json.encode(landData));
			}
		});
	}

	public LoadLand(data: String): void {
		if (Game.IsServer()) {

		}
		
		if (Game.IsClient()) {
			//this.SIGNAL_LOAD_LAND.client.FireServer({data});
			this.SIGNAL_LOAD_LAND.client.FireServer({data: "NEW"});
		}
	}
}