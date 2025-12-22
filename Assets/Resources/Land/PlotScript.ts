import { Game } from "@Easy/Core/Shared/Game";
import PlotManager from "Resources/Global Scripts/PlotManager";

export default class PlotScript extends AirshipBehaviour {

	public index: number;
	public text: GameObject;
	public gameCamera: GameObject;
	private owner: String;
	private ownerId: String;

	public textComponent: TMP_Text;

	override Start(): void {
		//
	}

	@Client()
	override OnTriggerEnter(collider: Collider): void {
		const char = collider.transform.parent.transform.parent.tag;
		const obj = collider.transform.parent.transform.parent.gameObject;

		print("hey")
		print(char)

		if (char === "Character" || char === "AirshipTag0") {
			print("hmm")
			if (obj === Game.localPlayer.character?.gameObject){
				print("PlotScript: Local character entered plot claim collider.")

				PlotManager.Get().AskToClaimPlot(this.index);
			}
		}
	}

	@Client()
	protected override Update(dt: number): void {
		this.text.transform.rotation = this.gameCamera.transform.rotation;
	}

	@Client()
	setOwner(owner: String, ownerId: String): void {
		this.owner = owner;
		this.ownerId = ownerId;

		this.textComponent!.text = owner + "'s farm";
	}

	@Client()
	setNilOwner(): void {
		this.owner = "none";
		this.ownerId = "none";

		this.textComponent!.text = "Free farm";
	}

	@Client()
	getOwner(): String {
		return this.owner;
	}

	@Client()
	getOwnerId(): String {
		return this.ownerId;
	}
}
