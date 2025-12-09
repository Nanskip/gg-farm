import ProximityPrompt from "@Easy/Core/Shared/Input/ProximityPrompts/ProximityPrompt";
import DialogueScript from "./DialogueScript";
import { Game } from "@Easy/Core/Shared/Game";

export default class ShopScript extends AirshipBehaviour {
	public prompt: ProximityPrompt;
	public dialogue: DialogueScript;

	public icon: Texture2D;
	public openShopSound: AudioSource;

	override Start(): void {
		if (Game.IsClient()) {
			this.prompt.onActivated.Connect(() => {
				this.openShop();
			});
		}
	}

	openShop(): void {
		print("Opening shop...");

		this.openShopSound.Play();
	}
}
