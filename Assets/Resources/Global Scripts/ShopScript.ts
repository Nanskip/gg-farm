import ProximityPrompt from "@Easy/Core/Shared/Input/ProximityPrompts/ProximityPrompt";
import DialogueScript from "./DialogueScript";
import { Game } from "@Easy/Core/Shared/Game";
import { getPlantSeedName, getPlantName, getPlant, Plants } from "./PlantList"
import PlantPrefabs from "./PlantPrefabs";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class ShopScript extends AirshipSingleton {
	public prompt: ProximityPrompt;
	public dialogue: DialogueScript;

	public icon: Texture2D;
	public openShopSound: AudioSource;
	public closeShopSound: AudioSource;
	public shopWindow: GameObject;
	public shopWindowCloseButton: Button;
	public shopScrollRight: Button;
	public shopScrollLeft: Button;
	public shopPurchaseSeedPackButton: Button;

	// information about selected crop
	public crop_name: TMP_Text;
	public crop_price: TMP_Text;
	public crop_rarity: TMP_Text;
	public crop_weight: TMP_Text;
	public crop_description: TMP_Text;
	public crop_stock: TMP_Text;

	public crop_3d_parent: GameObject;
	public crop_3d_rotator: GameObject;
	private crop_3d: GameObject;

	public seedList: string[] = [];
	private seedListIndex: number = 0;
	private clientStockData: Map<string, number> = new Map<string, number>();

	private serverCropStock: Map<string, number> = new Map<string, number>();
	private SIGNAL_SYNC_CROP_STOCK = new NetworkSignal<{stock_Map: Map<string, number>}>("SYNC_CROP_STOCK");
	private SIGNAL_ASK_SYNC = new NetworkSignal("ASK_SYNC");

	private sync_timer = 0;

	override Start(): void {
		if (Game.IsClient()) {
			this.prompt.onActivated.Connect(() => {
				this.openShop();
			});

			this.shopWindowCloseButton.onClick.Connect(() => {
				this.closeShop();
			});

			this.shopScrollRight.onClick.Connect(() => {
				this.scrollList(true);
			});

			this.shopScrollLeft.onClick.Connect(() => {
				this.scrollList(false);
			});

			this.shopPurchaseSeedPackButton.onClick.Connect(() => {
				this.askToPurchaseSeedPack(this.seedList[this.seedListIndex])
			});

			this.closeShop();

			this.SIGNAL_SYNC_CROP_STOCK.client.OnServerEvent((data) => {
				this.clientStockData = data.stock_Map;
			});
		}

		if (Game.IsServer()) {
			this.SIGNAL_ASK_SYNC.server.OnClientEvent((player) => {
				this.SIGNAL_SYNC_CROP_STOCK.server.FireClient(player, {stock_Map: this.serverCropStock});
			});
		}
	}

	override Update(dt: number): void {
		if (Game.IsClient()) {
			if (this.crop_3d_rotator !== undefined) {
				this.crop_3d_rotator.transform.Rotate(Vector3.up, dt * 10);
			}

			this.sync_timer += dt;
			if (this.sync_timer >= 5) {
				this.sync_timer = 0;
				this.SIGNAL_ASK_SYNC.client.FireServer();
			}
		}
	}

	@Client()
	openShop(): void {
		print("Opening shop...");

		this.openShopSound.Play();

		this.shopWindow.SetActive(true);
		this.setCrop("Carrot");
	}

	@Client()	
	closeShop(): void {
		print("Closing shop...");

		this.shopWindow.SetActive(false);
		this.closeShopSound.Play();
	}

	@Client()
	setCrop(name: string): void {
		print("ShopScript: setCrop: " + name);
		this.sync_timer = 9999;

		const crop = getPlant(name);

		this.crop_name.text = crop!.name;
		this.crop_price.text = "$" + crop!.seedPrice;
		this.crop_rarity.text = crop!.rarity;
		this.crop_weight.text = "Weight: " + tostring(crop!.averageWeight) + "g";
		this.crop_description.text = crop!.description;

		this.crop_stock.text = tostring(this.clientStockData.get(getPlantSeedName(crop!.name)));

		if (this.crop_3d !== undefined) {
			Destroy(this.crop_3d);
		}

		this.crop_3d = Object.Instantiate(PlantPrefabs.Get().getPlantPrefab(crop!.name), this.crop_3d_parent.transform);
		this.crop_3d.layer = LayerMask.NameToLayer("UI");

		// iterate through all children of crop_3d and set their layer to UI
		for (let i = 0; i < this.crop_3d.transform.childCount; i++) {
			const child = this.crop_3d.transform.GetChild(i);
			child.gameObject.layer = LayerMask.NameToLayer("UI");
		}
	}

	@Client()
	scrollList(forward: boolean = true) {
		if (forward) {
			this.seedListIndex++;

			if (this.seedListIndex >= this.seedList.size()) {
				this.seedListIndex = 0;
			}
		} else {
			this.seedListIndex--;

			if (this.seedListIndex < 0) {
				this.seedListIndex = this.seedList.size() - 1;
			}
		}

		this.setCrop(this.seedList[this.seedListIndex]);
	}

	@Client()
	askToPurchaseSeedPack(seedName: string): void {
		print("ShopScript: askToPurchaseSeedPack: " + seedName);


	};

	@Server()
	initializeCropStock(): void {
		print("SERVER: ShopScript: initializeCropStock");

		// fill crop stock with all seed names with 50 seeds
		for (const [key, value] of pairs(Plants)) {
			this.serverCropStock.set(key, 50);
		}
	}
}
