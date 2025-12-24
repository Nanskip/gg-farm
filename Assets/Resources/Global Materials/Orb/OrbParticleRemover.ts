export default class OrbParticleRemover extends AirshipBehaviour {

	private timer = 0;

	override Update(dt: number): void {
		this.timer += dt;

		if (this.timer >= 5) {
			Destroy(this.gameObject);
		}
	}
}
