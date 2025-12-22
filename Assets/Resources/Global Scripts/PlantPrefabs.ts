export default class PlantPrefabs extends AirshipSingleton {

	public plantPrefabs: GameObject[];
	public uiPlantPrefabs: GameObject[];

	getPlantPrefab(name: string): GameObject {
		for (const plantPrefab of this.plantPrefabs) {
			if (plantPrefab.name === name) {
				return plantPrefab;
			}
		}

		return GameObject.Create();
	}

	getUiPlantPrefab(name: string): GameObject {
		for (const plantPrefab of this.uiPlantPrefabs) {
			if (plantPrefab.name === name) {
				return plantPrefab;
			}
		}
		
		return GameObject.Create();
	}
}
