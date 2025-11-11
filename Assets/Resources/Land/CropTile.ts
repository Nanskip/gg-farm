import CropManager from "Resources/Global Scripts/CropManager";

export default class CropTile extends AirshipBehaviour {
	// Mainly crop tile is a tile with some data, using updater to create stuff if needed.
	// Crop tiles should be managed with CropManager, which is a singleton that communicates with the server.

	private _IS_PLANTED: boolean = false;
	private _DATA: String = "";

	override Start(): void {

	}

	@Client()
	_UPDATE(planted: boolean, data: String): void {
		this._IS_PLANTED = planted;
		this._DATA = data;

		if (planted) {
			this.transform.localPosition = new Vector3(this.transform.localPosition.x, 0.25, this.transform.localPosition.z);
		}
	}
}
