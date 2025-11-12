import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { ItemStack } from "@Easy/Core/Shared/Inventory/ItemStack";
import { Mouse } from "@Easy/Core/Shared/UserInput";

export default class PlayerManager extends AirshipSingleton {
	override Start(): void {
		print("PlayerManager initialized.");

        this.registerInventoryItems();

		// Create raycaster for mouse clicks in 3D space.
		Mouse.onLeftDown.Connect(() => {
            const screenPos3 = new Vector3(Mouse.position.x, Mouse.position.y, 0);
            const ray = Camera.main.ScreenPointToRay(screenPos3);

            const [hit, point, normal, collider] = Physics.Raycast(ray.origin, ray.direction, 1000);

			// If raycast hits an object.
            if (hit && collider) {
                const picked = collider.gameObject;
                
				// Everything is alright.
            }
        });

        // Give characters a wood sword on spawn
        if (Game.IsServer()) {
            Airship.Characters.ObserveCharacters((character) => {
                character.inventory?.AddItem(new ItemStack("test"));
            });
        }
	}

    public registerInventoryItems(): void {
        // Register a new item type
        Airship.Inventory.RegisterItem("test", {
            displayName: "test",
            accessoryPaths: ["Assets/Resources/ItemPrefabs/TestItem.prefab"],
            image: "Assets/Resources/ItemPrefabs/TestItem.jpg",
        });
    }
}
