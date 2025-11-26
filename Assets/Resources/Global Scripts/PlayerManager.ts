import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { ItemStack } from "@Easy/Core/Shared/Inventory/ItemStack";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import { Mouse } from "@Easy/Core/Shared/UserInput";
import CropManager from "./CropManager";
import CropTile from "Resources/Land/CropTile";

export default class PlayerManager extends AirshipSingleton {
    private yourPlotIndex: number = 0;

	override Start(): void {
		print("PlayerManager initialized.");

        this.registerInventoryItems();
        if (Game.IsServer()) {
            this.ConnectServerSignals();
        }

        if (Game.IsClient()) {
            this.ConnectClientSignals();
        }

        // Give characters items at spawn
        if (Game.IsServer()) {
            Airship.Characters.ObserveCharacters((character) => {
                character.inventory?.AddItem(new ItemStack("Hoe", 1));
                character.inventory?.AddItem(new ItemStack("CarrotSeed", 15));
            });
        }
	}

    @Client()
    public claimPlot(plotIndex: number): void {

    }

    public registerInventoryItems(): void {
        // Register a new item type
        Airship.Inventory.RegisterItem("Carrot", {
            displayName: "Carrot",
            accessoryPaths: ["Assets/Resources/ItemPrefabs/TestItem.prefab"],
            image: "Assets/Resources/ItemPrefabs/cat.png",
        });

        Airship.Inventory.RegisterItem("Hoe", {
            displayName: "Hoe",
            accessoryPaths: ["Assets/Resources/ItemPrefabs/TestHoe.prefab"],
            image: "Assets/Resources/ItemPrefabs/cat.png",
        });

        Airship.Inventory.RegisterItem("CarrotSeed", {
            displayName: "Carrot Seed",
            accessoryPaths: ["Assets/Resources/ItemPrefabs/SeedPack.prefab"],
            image: "Assets/Resources/ItemPrefabs/cat.png",
        });
    }

    @Server()
    private ConnectServerSignals(): void {

    }

    @Client()
    private ConnectClientSignals(): void {
		// Create raycaster for mouse clicks in 3D space.
		Mouse.onLeftDown.Connect(() => {
            const screenPos3 = new Vector3(Mouse.position.x, Mouse.position.y, 0);
            const ray = Camera.main.ScreenPointToRay(screenPos3);

            const [hit, point, normal, collider] = Physics.Raycast(ray.origin, ray.direction, 1000);

			// If raycast hits an object.
            if (hit && collider) {
                const picked = collider.gameObject;
            
                if (picked.tag === "Dirt") {
                    const dirtData = picked?.gameObject.GetAirshipComponent<CropTile>()?.getCoords() as String[];
                    CropManager.Get().clickDirt(tonumber(dirtData[0]) || 0, tonumber(dirtData[1]) || 0, tonumber(dirtData[2]) || 0, tonumber(dirtData[3]) || 0, tonumber(dirtData[4]) || 0);
                }
            }
        });
    }

    // ONLY FOR WEIGHT ITEM CLARIFICATION AND CREATION
    // (Carrot -> Carrot [50g], Carrot -> Carrot [100g] etc.)

    public registerNewInventoryItem(itemTypeBase: string, newName: string, newImage: string, amount: number = 1): void {
        // Register a new item type to make sure there's a lot of variants of weights for items
        Airship.Inventory.RegisterItem(newName, {
            displayName: newName,
            accessoryPaths: ["Assets/Resources/ItemPrefabs/TestItem.prefab"],
            image: newImage,
        });
    }
}


/*

// Everything is alright.
Airship.Inventory.ObserveLocalHeldItem((itemStack) => {
    if (itemStack?.itemDef.displayName === "Carrot") {
        // Test random weight application.
        const randomWeight = math.random(30, 150);
        const weightText = "Carrot [" + randomWeight + "g]";

        this.registerNewInventoryItem("Carrot", weightText, "Assets/Resources/ItemPrefabs/cat.png", 1);

        itemStack.Decrement(1);
        Game.localPlayer.character?.inventory.AddItem(new ItemStack(weightText));
    }
});

*/