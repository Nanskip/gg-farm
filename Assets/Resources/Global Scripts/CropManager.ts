import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class CropManager extends AirshipBehaviour {
	// CropManager is a singleton that manages crops.
	// It is responsible for creating crops, updating them, and destroying them.
	// All the operations are done on the server and just syncing with the clients.

	// A signal to load new land on both sides.
	// On client called when player picks land, on server called when land is created and sends data to clients.
	private SIGNAL_LOAD_LAND: NetworkSignal = new NetworkSignal<{}>("LOAD_LAND");

	@Server()
	override Start(): void {
		print("SERVER: CropManager initialized.");
	}
}