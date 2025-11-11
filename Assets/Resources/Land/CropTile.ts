export default class CropTile extends AirshipBehaviour {
	// Mainly crop tile is a tile with some data, using updater to create stuff if needed.
	// Crop tiles should be managed with CropManager, which is a singleton that communicates with the server.

	public CropManager: GameObject;

	private _manager: GameObject;
	private _IS_PLANTED: boolean = false;
	private _DATA: String = "";

	override Start(): void {
		//this._manager = this.CropManager.GetAirshipComponent<CropManager>();
	}
}
