import { Game } from "@Easy/Core/Shared/Game";
import PlotManager from "Resources/Global Scripts/PlotManager";

export default class PlotScript extends AirshipBehaviour {

	public index: number;
	public text: GameObject;

	override Start(): void {
		//
	}

	@Client()
	override OnTriggerEnter(collider: Collider): void {
		const char = collider.transform.parent.transform.parent.tag;
		const obj = collider.transform.parent.transform.parent.gameObject;

		print("hey")
		print(char)

		if (char === "Character") {
			print("hmm")
			if (obj === Game.localPlayer.character?.gameObject){
				print("PlotScript: Local character entered plot claim collider.")

				PlotManager.Get().AskToClaimPlot(this.index);
			}
		}
	}
}
