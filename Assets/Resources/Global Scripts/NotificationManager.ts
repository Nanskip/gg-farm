import NotifScript from "./NotifScript";

export default class NotificationManager extends AirshipSingleton {

	public NotifTextPrefab: GameObject;
	public NotifPanel: GameObject;

	private notifTextArray: Array<GameObject>;
	// array of notification texts appearing on screen

	override Start(): void {
		this.ShowNotification("Hello World!");
	}

	protected override Update(dt: number): void {
		if (this.notifTextArray !== undefined) {
			for (let i = 0; i < this.notifTextArray.size(); i++) {
				let notifText: GameObject = this.notifTextArray[i];

				if (notifText === undefined) {
					return;
				}
				
				notifText.GetAirshipComponent<NotifScript>()!.setIndex(i);
			}
		}
	}

	public ShowNotification(text: string): void {
		if (this.notifTextArray === undefined) {
			this.notifTextArray = new Array<GameObject>();
		}

		let notifText: GameObject = Instantiate(this.NotifTextPrefab, this.NotifPanel.transform);
		notifText.GetComponent<TMP_Text>()!.text = text;
		this.notifTextArray.insert(0, notifText);

		notifText.GetAirshipComponent<NotifScript>()!.setHide(2, 0.05);
	}
}
