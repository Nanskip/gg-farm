import { Game } from "@Easy/Core/Shared/Game";
import CropManager from "Resources/Global Scripts/CropManager";
import PlayerManager from "Resources/Global Scripts/PlayerManager";

export default class CropTile extends AirshipBehaviour {
	// Mainly crop tile is a tile with some data, using updater to create stuff if needed.
	// Crop tiles should be managed with CropManager, which is a singleton that communicates with the server.

	private _IS_PLANTED: boolean = false;
	private _DATA: String = "";
	private _UNLOCKED: boolean = false;
	private _DIGGED: boolean = false;

	private crop: GameObject;
	private timerText: GameObject;
	private timerTextComponent: TMP_Text;
	private timer: number;

	private coords = {index: 0,cx: 0, cy: 0, x: 0, y: 0};

	private diggedMaterial: Material;

	private updateTimer = 0;
	private updatePending = false;

	private timerTimer = 0;

	private cameraRig: GameObject;

	@Client()
	override Start(): void {
		this.diggedMaterial = CropManager.Get().DiggedMaterial;

		this.cameraRig = PlayerManager.Get().getCameraRig();
	}

	@Client()
	override Update(dt: number): void {
		if (this.updatePending) {
			this.updateTimer += dt;
			if (this.updateTimer >= 1) {
				this.updateTimer = 0;
				this.updatePending = false;

				this._UPDATE_END();
			}
		}

		if (this.timerText === undefined) {
			return;
		}
		this.timerText.transform.rotation = this.cameraRig.transform.rotation;

		// update crop timer
		this.timerTimer += dt;
		if (this.timerTimer >= 1) {
			this.timerTimer = 0;
			
			let num = tonumber(this.timer) || 0;
			num -= 1;

			this.timerTextComponent.text = tostring(num);
			this.timer = num;

			if (num <= 0) {
				this.timerTextComponent.text = "0";
			}
		}
	}

	@Client()
	_UPDATE(planted: boolean, data: String, unlocked: boolean = false, doNotUpdate: boolean = false): void {
		this._UNLOCKED = unlocked;
		this._IS_PLANTED = planted;
		this._DATA = data;

		if (!doNotUpdate) {
			this.updatePending = true;
			this.updateTimer = 0;
		}
	}

	@Client()
	_UPDATE_END(): void {
		if (this._UNLOCKED) {
			this.gameObject.SetActive(true);
		} else {
			this.gameObject.SetActive(false);
		}
		
		if (this._IS_PLANTED) {
			this.transform.localPosition = new Vector3(this.transform.localPosition.x, 0.25, this.transform.localPosition.z);
		}

		if (this._DIGGED) {
			this.gameObject.GetComponent<MeshRenderer>()?.SetMaterial(0, this.diggedMaterial)
		}
	}

	@Client()
	createCropPrefab(cropPrefab: GameObject, timerPrefab: GameObject, time: string): void {
		if (this.crop !== undefined) {
			Destroy(this.crop);
			Destroy(this.timerText);
		}

		this.crop = Object.Instantiate(cropPrefab, this.transform.parent.transform.parent);

		this.crop.transform.position = this.transform.position;

		this.timerText = Object.Instantiate(timerPrefab, this.transform.parent.transform.parent);
		this.timerText.transform.position = new Vector3(this.transform.position.x, this.transform.position.y + 1.5, this.transform.position.z);

		this.timerTextComponent = this.timerText.GetComponent<TMP_Text>()!;
		this.timerTextComponent.text = time;

		this.timer = tonumber(time) || 0;
	}

	@Client()
	_DIG(digged: boolean): void {
		this._DIGGED = digged;
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
