import ProximityPrompt from "@Easy/Core/Shared/Input/ProximityPrompts/ProximityPrompt";
import DialogueScript from "./DialogueScript";
import { Airship } from "@Easy/Core/Shared/Airship";
import { ItemStack } from "@Easy/Core/Shared/Inventory/ItemStack";
import { Game } from "@Easy/Core/Shared/Game";
import MoneyManager from "./MoneyManager";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";

export default class SellScript extends AirshipBehaviour {
	public prompt: ProximityPrompt;
	public dialogue: DialogueScript;

	public icon: Texture2D;
	public sellSound: AudioSource;

	private SIGNAL_DECREMENT_ITEM = new NetworkSignal<{item: string, playerName: string}>("SINGAL_DECREMENT_ITEM");

	override Start(): void {
		if (Game.IsClient()) {
			this.prompt.onActivated.Connect(() => {
				this.prepareSell();
			});

			this.SIGNAL_DECREMENT_ITEM.client.OnServerEvent((data) => {
				print("CLIENT: Player " + data.playerName + " decremented item: " + data.item);

				Airship.Characters.ObserveCharacters((character) => {
					if (character.player?.userId === data.playerName) {
						if (character.player?.userId !== Game.localPlayer?.userId) {
							character.inventory?.Decrement(data.item, 1);
						}
					}
				});
			});
		}

		if (Game.IsServer()) {
			this.SIGNAL_DECREMENT_ITEM.server.OnClientEvent((player, data) => {
				print("SERVER: Player " + player.userId + " decremented item: " + data.item);

				this.SIGNAL_DECREMENT_ITEM.server.FireAllClients({item: data.item, playerName: player.userId});
			});
		}
	}

	@Client()
	private prepareSell(): void {
		print("Activated prompt");

		this.dialogue.setName("John");
		this.dialogue.setImage(this.icon);
		this.dialogue.writeText("Hello, i can buy your crops. Do you want to sell some?", false, 1, 60, () => {
			this.dialogue.showVariants();
		});

		this.dialogue.setVariant1("Yes", () => {
			this.yes1();
		});

		this.dialogue.setVariant2("No", () => {
			this.no1();
		});

		this.dialogue.hideVariants();
	}

	@Client()
	private no1(): void {
		print("No");

		this.dialogue.setName("John");
		this.dialogue.setImage(this.icon);

		this.dialogue.hideVariants();

		const randomText = [
			"Huh? Okay, you can come back later then.",
			"Well, i will wait then. Bye.",
			"Hmm... Okay, i understand you.",
			"Bruh, why you're asking me then?",
			"Just waiting for you then.",
		]
		this.dialogue.writeText(randomText[math.random(0, randomText.size()-1)], false, 3, 3);
	}

	@Client()
	private yes1(): void {
		print("Yes");

		this.dialogue.setName("John");
		this.dialogue.setImage(this.icon);

		this.dialogue.hideVariants();

		const randomText = [
			"Okay, let's see what you got...",
			"Sure, let's see what you got...",
			"Okay, show me what you got now...",
			"Hmm, let me see what you got...",
			"Let me think... Hm..."
		]
		this.dialogue.writeText(randomText[math.random(0, randomText.size()-1)], false, 1, 10, () => {
			this.dialogue.setVariant1("Take this one.", () => {
				this.checkItem();
			})

			this.dialogue.setVariant2("Sell everything!", () => {
				this.sellEverything();
			})

			this.dialogue.showVariants();
		}, false);

		// this.dialogue.writeText(randomText[math.random(0, randomText.size()-1)], false, 3, 3, () => {
		// 	this.checkItem();
		// }, true);
	}

	@Client()
	private sellEverything(): void {
		print("Sell everything");

		// loop through all items in inventory
		let totalPrice = 0;

		this.dialogue.setName("John");
		this.dialogue.setImage(this.icon);

		this.dialogue.hideVariants();

		Game.localPlayer.character?.inventory?.GetAllItems().forEach(element => {
			const item = element.itemDef.itemType;
			
			const raw = tostring(item);
			const [name, num] = this.parseItem(raw);

			const cnum = tonumber(num) || 0;

			if (cnum > 0) {
				const money = math.round((cnum / 70) * 5);
				// 70 is average grams of carrot

				print("Carrot price: " + money);

				Game.localPlayer.character?.inventory?.Decrement(item, 1);

				this.SIGNAL_DECREMENT_ITEM.client.FireServer({item: item, playerName: Game.localPlayer.userId});

				totalPrice += money;
			}
		});

		if (totalPrice === 0) {
			this.dialogue.writeText("You don't have anything to sell.", false, 3, 3);
			return;
		}
		this.dialogue.writeText("Thank you! Here's your " + totalPrice + "$!", false, 2, 3);

		MoneyManager.Get().addMoney(totalPrice);

		this.sellSound.Play();
	}

	@Client()
	private checkItem(): void {
		print("Checking item...");

		let item = "none";
		Airship.Inventory.ObserveLocalHeldItem((itemStack) => {
			item = itemStack?.itemDef.itemType || "none";
		});

		if (item === "none") {
			this.noItem();
		} else {
			this.yesItem(item);
		}
	}

	@Client()
	private noItem(): void {
		print("No item");

		this.dialogue.setName("John");
		this.dialogue.setImage(this.icon);

		this.dialogue.hideVariants();

		const randomText = [
			"Nothing? You're wasting my time.",
			"You're wasting my time.",
			"I don't have anything to sell.",
			"Bro, you're wasting my time.",
			"Stop wasting my time.",
		]

		this.dialogue.writeText(randomText[math.random(0, randomText.size()-1)], false, 3, 3)
	}

	@Client()
	private yesItem(item: string): void {
		print("Yes item: " + item);

		this.dialogue.setName("John");
		this.dialogue.setImage(this.icon);

		this.dialogue.hideVariants();

		let text = "Do you want to sell " + item + "?";

		this.dialogue.writeText(text, false, 3, 3, () => {
			this.dialogue.showVariants();
		}, false);

		this.dialogue.setVariant1("Yes", () => {
			this.yes2(item);
		});

		this.dialogue.setVariant2("No", () => {
			this.no1();
		});
	}

	@Client()
	private yes2(item: string): void {
		print("Yes2: " + item);

		this.dialogue.setName("John");
		this.dialogue.setImage(this.icon);

		this.dialogue.hideVariants();

		if (item === "CarrotSeed" || item === "Hoe") {
			this.dialogue.writeText("Bro what? I can't buy that " + item + ".", false, 3, 3);
		}

		const raw = tostring(item);
		const [name, num] = this.parseItem(raw);

		const cnum = tonumber(num) || 0;
		if (name === "Carrot") {
			const money = math.round((cnum / 70) * 5);
			// 70 is average grams of carrot

			print("Carrot price: " + money);

			Game.localPlayer.character?.inventory?.Decrement(item, 1);

			this.SIGNAL_DECREMENT_ITEM.client.FireServer({item: item, playerName: Game.localPlayer.userId});

			this.dialogue.writeText("Thank you! Here's your " + money + "$!", false, 2, 3);

			MoneyManager.Get().addMoney(money);

			this.sellSound.Play();
		}
	}

	parseItem(raw: string): string[] {
		const [openStart] = string.find(raw, "[", 1, true)! || 0;
		const [gStart] = string.find(raw, "g]", 1, true)! || 0;

		const name = string.sub(raw, 1, (openStart || 0) - 2);
		const num = tonumber(string.sub(raw, (openStart || 0) + 1, (gStart || 0) - 1)) || 0;

		return [name, tostring(num)];
	}
}
