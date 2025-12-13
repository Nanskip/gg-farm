export default class PlantPrefabs extends AirshipSingleton {

	public plantPrefabs: GameObject[];

	getPlantPrefab(name: string): GameObject {
		for (const plantPrefab of this.plantPrefabs) {
			if (plantPrefab.name === name) {
				return plantPrefab;
			}
		}

		return GameObject.Create();
	}
}
