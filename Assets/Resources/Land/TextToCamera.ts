export default class TextToCamera extends AirshipBehaviour {
	private object: GameObject;

	override Start(): void {
		this.object = this.gameObject;
	}

	override Update(dt: number): void {
		this.object.transform.rotation = Camera.main.transform.rotation;
	}
}
