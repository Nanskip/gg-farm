export default class MusicManager extends AirshipSingleton {

	public ambientMusic: AudioSource;
	public shopMusic: AudioSource;

	private currentState: string;

	private musicVolume: number = 0.05;

	override Start(): void {
		this.currentState = "ambient";

		// play music but set volume to 0
		this.ambientMusic.Play();
		this.ambientMusic.volume = 0;
		this.shopMusic.Play();
		this.shopMusic.volume = 0;
	}

	override Update(dt: number): void {
		if (this.currentState === "ambient") {

			this.ambientMusic.volume = math.lerp(this.ambientMusic.volume, this.musicVolume, 0.1);
			this.shopMusic.volume = math.lerp(this.shopMusic.volume, 0, 0.1);

		} else if (this.currentState === "shop") {

			this.ambientMusic.volume = math.lerp(this.ambientMusic.volume, 0, 0.1);
			this.shopMusic.volume = math.lerp(this.shopMusic.volume, this.musicVolume, 0.1);

		}
	}

	public setState(state: string): void {
		this.currentState = state;

		if (state === "shop") {
			this.shopMusic.Play();
		}
	}
}
