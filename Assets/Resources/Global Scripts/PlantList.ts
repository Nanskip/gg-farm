
export const Plants = {
    Carrot: {
		price: 5,
        averageWeight: 50,
		maxWeight: 130,
		minWeight: 30,
		growTime: 10,
		seedPrice: 3,
		description: "A classic orange crunchy vegetable. Consumed raw or cooked, it's a staple in many dishes. It's also a good source of vitamin A and C.",
		name: "Carrot",
		rarity: "Common",
    },

	Potato: {
		price: 15,
        averageWeight: 300,
		maxWeight: 600,
		minWeight: 170,
		growTime: 25,
		seedPrice: 8,
		description: "Classic potato. A starchy tuber with a creamy texture. It's a versatile vegetable that can be used in many dishes. It's also a good source of fiber and vitamins.",
		name: "Potato",
		rarity: "Common",
    },
	
} as const;

export type PlantName = keyof typeof Plants;

export function getPlant(name: string) {
    if (name in Plants) {
        return Plants[name as keyof typeof Plants];
    }
    return undefined;
}

export function getPlantSeedName(name: string) {
	return name + "Seed";
}

export function getPlantName(seedName: string) {
	return string.gsub(seedName, "Seed$", "")[0];
}

export function isACrop(name: string) {
	return getPlant(name) !== undefined;
}