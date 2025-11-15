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

	
}