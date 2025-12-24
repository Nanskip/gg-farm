import ProximityPrompt from "@Easy/Core/Shared/Input/ProximityPrompts/ProximityPrompt";
import DialogueScript from "./DialogueScript";
import { Game } from "@Easy/Core/Shared/Game";
import { getPlantSeedName, getPlantName, getPlant, Plants } from "./PlantList"
import PlantPrefabs from "./PlantPrefabs";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import MoneyManager from "./MoneyManager";
import { Airship } from "@Easy/Core/Shared/Airship";
import { ItemStack } from "@Easy/Core/Shared/Inventory/ItemStack";
import MusicManager from "Resources/Music/MusicManager";

export default class ShopScript extends AirshipSingleton {
	public prompt: ProximityPrompt;
	public dialogue: DialogueScript;

	public icon: Texture2D;
	public buttonClickSound: AudioSource;
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
	private SIGNAL_SYNC_CROP_STOCK = new NetworkSignal<{nameTable: string[], amountTable: number[]}>("SYNC_CROP_STOCK");
	private SIGNAL_ASK_SYNC = new NetworkSignal("ASK_SYNC");

	private SIGNAL_ASK_PURCHASE_SEED_PACK = new NetworkSignal<{cropName: string}>("ASK_PURCHASE_SEED_PACK");
	private SIGNAL_PURCHASE_SEED_PACK = new NetworkSignal<{cropName: string, playerName: string}>("PURCHASE_SEED_PACK");

	private sync_timer = 0;
	private crop_Stock_Initialized = false;

	override Start(): void {
		if (Game.IsClient()) {
			this.prompt.onActivated.Connect(() => {
				this.openShop();
			});

			this.shopWindowCloseButton.onClick.Connect(() => {
				this.closeShop();

				this.buttonClickSound.Play();
			});

			this.shopScrollRight.onClick.Connect(() => {
				this.scrollList(true);

				this.buttonClickSound.Play();
			});

			this.shopScrollLeft.onClick.Connect(() => {
				this.scrollList(false);

				this.buttonClickSound.Play();
			});

			this.shopPurchaseSeedPackButton.onClick.Connect(() => {
				this.askToPurchaseSeedPack(this.seedList[this.seedListIndex])

				this.buttonClickSound.Play();
			});

			this.closeShop(true);

			this.SIGNAL_SYNC_CROP_STOCK.client.OnServerEvent((data) => {
				// decompile 2 different arrays into a map
				print(data.amountTable)
				print(data.nameTable)

				for (let i = 0; i < data.nameTable.size(); i++) {
					this.clientStockData.set(data.nameTable[i], data.amountTable[i]);

					print("ShopScript: Client stock data: " + data.nameTable[i] + ": " + data.amountTable[i]);
				}
			});

			this.SIGNAL_PURCHASE_SEED_PACK.client.OnServerEvent((data) => {
				print("CLIENT: Player " + data.playerName + " purchased seed pack: " + data.cropName);
			});
		}

		if (Game.IsServer()) {
			this.SIGNAL_ASK_SYNC.server.OnClientEvent((player) => {
				// compile map into 2 different arrays
				let nameTable: string[] = [];
				let amountTable: number[] = [];

				this.serverCropStock.forEach((value, key) => {
					nameTable[nameTable.size()] = key;
					amountTable[amountTable.size()] = value;

					print("ShopScript: Server stock data: " + key + ": " + value);
				});

				this.SIGNAL_SYNC_CROP_STOCK.server.FireClient(player, {
					nameTable: nameTable,
					amountTable: amountTable
				});
			});

			this.SIGNAL_ASK_PURCHASE_SEED_PACK.server.OnClientEvent((player, data) => {
				print("SERVER: Player " + player.userId + " asked to purchase seed pack: " + data.cropName);

				let isAvailable = this.serverCropStock.has(data.cropName);
				isAvailable = isAvailable && this.serverCropStock.get(data.cropName)! > 0;
				isAvailable = isAvailable && MoneyManager.Get().getMoneyServer(player) >= getPlant(data.cropName)!.seedPrice

				if (isAvailable) {
					print("SERVER: Crop " + data.cropName + " for " + player.username + " is available, purchasing...");

					this.SIGNAL_PURCHASE_SEED_PACK.server.FireAllClients({cropName: data.cropName, playerName: player.userId});

					Airship.Characters.ObserveCharacters((character) => {
						if (character.player?.userId === player.userId) {
							character.inventory?.AddItem(new ItemStack(getPlantSeedName(data.cropName), 1));
						}
					});

					this.serverCropStock.set(data.cropName, this.serverCropStock.get(data.cropName)! - 1);

					MoneyManager.Get().addMoneyServer((-getPlant(data.cropName)!.seedPrice) || 0, player);	
				}
			});
		}
	}

	@Header("Update")
	override Update(dt: number): void {
		if (Game.IsClient()) {
			if (this.crop_3d_rotator !== undefined) {
				this.crop_3d_rotator.transform.Rotate(Vector3.up, dt * 10);
			}

			this.sync_timer += dt;
			if (this.sync_timer >= 5) {
				this.sync_timer = 0;
				this.SIGNAL_ASK_SYNC.client.FireServer();

				print("ShopScript: Syncing crop stock...");
			}
		}

		if (Game.IsServer()) {
			if (!this.crop_Stock_Initialized) {
				this.initializeCropStock();
			}
		}
	}

	@Client()
	openShop(): void {
		print("Opening shop...");

		this.openShopSound.Play();

		this.shopWindow.SetActive(true);
		this.shopWindow.GetComponent<RectTransform>()!.anchoredPosition = new Vector2(0, 0);
		this.setCrop("Carrot");

		MusicManager.Get().setState("shop");
	}

	@Client()	
	closeShop(noSound: boolean = false): void {
		print("Closing shop...");

		this.shopWindow.SetActive(false);
		if (!noSound) {
			this.closeShopSound.Play();
		}
		
		MusicManager.Get().setState("ambient");
	}

	@Client()
	setCrop(name: string): void {
		print("ShopScript: setCrop: " + name);
		this.sync_timer = 9999;
		print("ShopScript: Syncing crop stock...");

		const crop = getPlant(name);

		this.crop_name.text = crop!.name;
		this.crop_price.text = "$" + crop!.seedPrice;
		this.crop_rarity.text = crop!.rarity;
		this.crop_weight.text = "Weight: " + tostring(crop!.averageWeight) + "g";
		this.crop_description.text = crop!.description;

		this.crop_stock.text = tostring(this.clientStockData.get(crop!.name));

		if (this.crop_3d !== undefined) {
			Destroy(this.crop_3d);
		}

		this.crop_3d = Object.Instantiate(PlantPrefabs.Get().getUiPlantPrefab(crop!.name), this.crop_3d_parent.transform);
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
		print("ShopScript: Asking server to purchase seed pack: " + seedName);

		this.SIGNAL_ASK_PURCHASE_SEED_PACK.client.FireServer({cropName: seedName});
	};

	@Server()
	initializeCropStock(): void {
		print("SERVER: ShopScript: initializeCropStock");
		this.crop_Stock_Initialized = true;

		// fill crop stock with all seed names with 50 seeds
		for (const [key, value] of pairs(Plants)) {
			this.serverCropStock.set(key, 50);
		}
	}
}
