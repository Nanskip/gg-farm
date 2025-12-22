export default class LevelSystem extends AirshipSingleton {

	@Header("UI")

	public levelText: TMP_Text;
	public experienceText: TMP_Text;
	public experienceBar: GameObject;
	private EXP_MIN_WIDTH: number = 10;
	private EXP_MAX_WIDTH: number = 197;

	// data storage
	private level: number = 1;
	private experience: number = 0;
	private experienceNeeded: number = 5;

	override Start(): void {
		
	}

	override Update(dt: number): void {
		this.calculateLevels();
		this.updateUi();

		this.addExperience(1);
	}

	public addExperience(amount: number): void {
		this.experience += amount;
	}

	private updateUi(): void {
		this.levelText.text = tostring(this.level);
		this.experienceText.text = tostring(this.experience) + "/" + tostring(this.experienceNeeded);

		const width = math.lerp(this.EXP_MIN_WIDTH, this.EXP_MAX_WIDTH, this.experience / this.experienceNeeded);
		let finWidth = 0;

		if (width > this.EXP_MAX_WIDTH) {
			finWidth = this.EXP_MAX_WIDTH;
		} else if (width < this.EXP_MIN_WIDTH) {
			finWidth = this.EXP_MIN_WIDTH;
		} else {
			finWidth = width;
		}

		this.experienceBar.GetComponent<RectTransform>()!.sizeDelta = new Vector2(
			finWidth,
			this.experienceBar.GetComponent<RectTransform>()!.sizeDelta.y
		);
	}

	private calculateLevels(): void {
		// calculate level
		if (this.experience >= this.experienceNeeded) {
			this.level += 1;
			this.experience = this.experience - this.experienceNeeded;
			this.experienceNeeded += 5;
		}
	}
}
