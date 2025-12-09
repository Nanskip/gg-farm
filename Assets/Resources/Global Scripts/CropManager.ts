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
	public cropPrefabs: GameObject[] = [];
	public cropTimerPrefab: GameObject;
	public DiggedMaterial: Material;
	public Material: Material;

	@Client()
	public clickDirt(plotIndex: number, cx: number, cy: number, x: number, y: number, eventType: string, crop: string): void {
		// print("CLIENT: Clicked dirt at plot #" + plotIndex + " at (" + cx + ", " + cy + ") at (" + x + ", " + y + ").");

		// const plot = this.Plots[plotIndex];
		// const dirt = plot.transform.Find("Dirt_" + cx + "_" + cy).transform.Find("CropTile_" + x + "_" + y);
		// const dirtScript = dirt?.gameObject.GetAirshipComponent<CropTile>();

		// dirtScript?._UPDATE(true, "test", true);

		// // change material to digged dirt
		// dirtScript?.gameObject.GetComponent<MeshRenderer>()?.SetMaterial(0, this.DiggedMaterial);

		const plot = this.Plots[plotIndex];
		const dirt = plot.transform.Find("Dirt_" + cx + "_" + cy).transform.Find("CropTile_" + x + "_" + y);
		const dirtScript = dirt?.gameObject.GetAirshipComponent<CropTile>();

		if (eventType === "Hoe") {
			dirtScript?._DIG(true);

			dirtScript?._UPDATE(true, "test", true);
		}
	}

	@Client()
	public setCrop(plotIndex: number, cx: number, cy: number, x: number, y: number, crop: string[]): void {
		const plot = this.Plots[plotIndex];
		const dirt = plot.transform.Find("Dirt_" + cx + "_" + cy).transform.Find("CropTile_" + x + "_" + y);
		const dirtScript = dirt?.gameObject.GetAirshipComponent<CropTile>();

		dirtScript?._UPDATE(true, crop[1], true, true);

		print("Crop: " + crop[2]);

		if (crop[2] === "none") {
			dirtScript?._DIG(false);
			dirtScript?._UNHARVEST();
			dirtScript?._UPDATE(false, crop[1], true, true);

			return;
		}
		if (crop[2] === "Carrot") {
			dirtScript?.createCropPrefab(this.cropPrefabs[0], this.cropTimerPrefab, tostring(crop[3]));
		}
	}

	@Client()
	public setCropFinish(plotIndex: number, cx: number, cy: number, x: number, y: number, crop: string[]): void {
		const plot = this.Plots[plotIndex];
		const dirt = plot.transform.Find("Dirt_" + cx + "_" + cy).transform.Find("CropTile_" + x + "_" + y);
		const dirtScript = dirt?.gameObject.GetAirshipComponent<CropTile>();

		dirtScript?._FINISH();
	}
}