export default class NotifScript extends AirshipBehaviour {
	
	private index: number = 0;
	private yOffset: number = 0;
	private yOffsetFine: number = 0;

	private self_rect_transform: RectTransform;
	private hideTimer: number = 0;
	private hideTime: number = 3;
	private hideSpeed: number = 0.05;

	private alpha: number = 1;

	override Start(): void {
		this.self_rect_transform = this.gameObject.GetComponent<RectTransform>()!;

		this.alpha = this.gameObject.GetComponent<TMP_Text>()!.alpha;
	}

	override Update(dt: number): void {
		this.yOffset = this.index * -40;

		this.yOffsetFine = math.lerp(this.yOffsetFine, this.yOffset, 0.1);

		this.self_rect_transform.anchoredPosition = new Vector2(0, this.yOffsetFine);

		this.hideTimer += dt;

		if (this.hideTimer >= this.hideTime) {
			this.alpha = math.lerp(this.alpha, 0, this.hideSpeed)
			this.gameObject.GetComponent<TMP_Text>()!.alpha = this.alpha;
			
			if (this.alpha <= 0.05) {
				Destroy(this.gameObject);
			}
		}
	}

	public setIndex(index: number): void {
		this.index = index;
	}

	public setHide(time: number, hideSpeed: number): void {
		this.hideTimer = 0;
		this.hideTime = time;
		this.hideSpeed = hideSpeed;
	}
}
