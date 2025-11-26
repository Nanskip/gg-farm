import CropManager from "Resources/Global Scripts/CropManager";

export default class CropTile extends AirshipBehaviour {
	// Mainly crop tile is a tile with some data, using updater to create stuff if needed.
	// Crop tiles should be managed with CropManager, which is a singleton that communicates with the server.

	private _IS_PLANTED: boolean = false;
	private _DATA: String = "";
	private _UNLOCKED: boolean = false;

	private coords = {index: 0,cx: 0, cy: 0, x: 0, y: 0};

	override Start(): void {

	}

	@Client()
	_UPDATE(planted: boolean, data: String, unlocked: boolean = false): void {
		this._UNLOCKED = unlocked;
		this._IS_PLANTED = planted;
		this._DATA = data;

		if (this._UNLOCKED) {
			this.gameObject.SetActive(true);
		} else {
			this.gameObject.SetActive(false);
		}
		
		if (planted) {
			this.transform.localPosition = new Vector3(this.transform.localPosition.x, 0.25, this.transform.localPosition.z);
		}
	}

	@Client()
	public init(index: number, cx: number, cy: number, x: number, y: number): void {
		this.coords = {index: index, cx: cx, cy: cy, x: x, y: y};
	}

	@Client()
	public getCoords(): String[] {
		return [tostring(this.coords.index), tostring(this.coords.cx), tostring(this.coords.cy), tostring(this.coords.x), tostring(this.coords.y)];
	}
}
