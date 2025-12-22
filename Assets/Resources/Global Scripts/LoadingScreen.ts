import PlotManager from "./PlotManager";

export default class LoadingScreen extends AirshipSingleton {

	public loadingText: TMP_Text;
	public blackScreen: Image;
	public pop_sound: AudioSource;
	public loading_gif: Image;

	private timer = 0;
	private step = 0;
	private finished = false;
	private synced = 0;

	private syncEnd = 2; // how many lands in scene

	override Start(): void {
		
	}

	@Client()
	override Update(dt: number): void {
		this.timer += dt;

		if (this.step === 0) {
			if (this.timer >= 1) {
				this.timer = 0;
				this.step++;

				PlotManager.Get().askSyncLands();
				this.loadingText.text = "Synchronization...";
				this.pop_sound.pitch = 1;
				this.pop_sound.Play();
			}
		}

		if (this.step === 1) {
			if (this.timer >= 1) {
				if (this.synced >= this.syncEnd) {
					this.timer = 0;
					this.step++;

					this.loadingText.text = "Finished!";
					this.pop_sound.pitch = 1.5;
					this.pop_sound.Play();
				}
			}
		}

		if (this.step === 2) {
			if (this.timer < 1) {
				this.blackScreen.color = new Color(
					this.blackScreen.color.r,
					this.blackScreen.color.g,
					this.blackScreen.color.b,
					math.lerp(1, 0, this.timer)
				);

				this.loadingText.transform.localPosition = new Vector3(
					this.loadingText.transform.localPosition.x - 5,
					this.loadingText.transform.localPosition.y,
					this.loadingText.transform.localPosition.z
				)

				this.loading_gif.transform.localPosition = new Vector3(
					this.loading_gif.transform.localPosition.x - 5,
					this.loading_gif.transform.localPosition.y,
					this.loading_gif.transform.localPosition.z
				)
			}

			if (this.timer >= 1) {
				this.blackScreen.enabled = false;
				this.loadingText.enabled = false;
				this.loading_gif.enabled = false;

				this.finished = true;
			}
		}
	}

	@Client()
	public syncLands(): void {
		print("Synced lands: " + this.synced);
		this.synced++;
	}
}
