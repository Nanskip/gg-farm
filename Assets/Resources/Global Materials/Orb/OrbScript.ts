import { Game } from "@Easy/Core/Shared/Game";
import OrbSystem from "Resources/Global Scripts/OrbSystem";

export default class OrbScript extends AirshipBehaviour {

	public orbParticler: GameObject;

	@Client()
	override OnTriggerEnter(collider: Collider): void {
		const char = collider.transform.parent.transform.parent.tag;
		const obj = collider.transform.parent.transform.parent.gameObject;

		if (char === "Character" || char === "AirshipTag0") {
			if (obj === Game.localPlayer.character?.gameObject){
				print("Asking to pickup orb at " + this.gameObject.transform.position);

				Object.Instantiate(this.orbParticler, this.gameObject.transform.position, Quaternion.identity);

				OrbSystem.Get().askToPickupOrb(this.gameObject.transform.position);
			}
		}
	}

}
