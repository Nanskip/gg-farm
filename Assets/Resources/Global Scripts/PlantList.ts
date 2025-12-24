
export const Plants = {
    Carrot: {
		price: 5,
        averageWeight: 50,
		maxWeight: 130,
		minWeight: 30,
		growTime: 10,
		seedPrice: 3,
		description: "A classic orange crunchy vegetable. Can be eaten raw or cooked and fits well in soups, salads, and main dishes. Simple, reliable, and widely used.",
		name: "Carrot",
		rarity: "Common",
    },

	Potato: {
		price: 15,
        averageWeight: 300,
		maxWeight: 600,
		minWeight: 170,
		growTime: 20,
		seedPrice: 8,
		description: "A classic starchy tuber with a soft, filling texture when cooked. Extremely versatile: can be boiled, fried, baked, or mashed. A base ingredient for countless meals.",
		name: "Potato",
		rarity: "Common",
    },
	
	Wheat: {
		price: 21,
        averageWeight: 100,
		maxWeight: 190,
		minWeight: 70,
		growTime: 35,
		seedPrice: 14,
		description: "A basic grain used to produce flour and many staple foods. Commonly processed into bread, pasta, and other baked goods. One of the most important crops in everyday cooking.",
		name: "Wheat",
		rarity: "Uncommon",
    },

	Onion: {
		price: 30,
        averageWeight: 150,
		maxWeight: 220,
		minWeight: 110,
		growTime: 48,
		seedPrice: 24,
		description: "A strong-flavored vegetable often used as a base for cooking. Adds depth and aroma to dishes when fried or boiled, and can also be eaten raw for a sharper taste.",
		name: "Onion",
		rarity: "Uncommon",
    },
} as const;

export const PlantsCount = 4;

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