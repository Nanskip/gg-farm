import { Airship } from "@Easy/Core/Shared/Airship";
import { Game } from "@Easy/Core/Shared/Game";
import { ItemStack } from "@Easy/Core/Shared/Inventory/ItemStack";
import { NetworkSignal } from "@Easy/Core/Shared/Network/NetworkSignal";
import { Mouse } from "@Easy/Core/Shared/UserInput";
import CropManager from "./CropManager";
import CropTile from "Resources/Land/CropTile";
import PlotManager from "./PlotManager";

export default class PlayerManager extends AirshipSingleton {
    private yourPlotIndex: number = 0;

    public hoeDigAnim?: AnimationClip;
    public hoeDigSound?: AudioSource;

    public seedAnim? : AnimationClip;

    public characterAnimationEventListener?: AnimationEventListener;

    public cameraRig: GameObject;

    private stayTimer = 0;
    private shouldStay = false;
    private stayPos: Vector3;
    private stayRot: Quaternion;

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
    override Update(dt: number): void {
        if (this.shouldStay) {
            Game.localPlayer.character!.movement.transform.position = this.stayPos;
            Game.localPlayer.character!.movement.graphicTransform.rotation = this.stayRot;

            this.stayTimer += dt;
            if (this.stayTimer >= 1.3) {
                this.stayTimer = 0;
                this.shouldStay = false;
            }
        }
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
            print(Game.localPlayer.character?.gameObject.name);
            this.characterAnimationEventListener = Game.localPlayer.character?.gameObject.GetComponent<CharacterAnimationHelper>()?.animationEvents;

            this.characterAnimationEventListener?.OnAnimEvent((key)=>{
                //Key is the string value you specify in editor
                if(key === "hoeDigged"){
                    this.hoeDigSound?.Play();
                }
                print("Event: " + key);
            })


            const screenPos3 = new Vector3(Mouse.position.x, Mouse.position.y, 0);
            const ray = Camera.main.ScreenPointToRay(screenPos3);

            const [hit, point, normal, collider] = Physics.Raycast(ray.origin, ray.direction, 1000);

			// If raycast hits an object.
            if (hit && collider) {
                const picked = collider.gameObject;
            
                if (picked.tag === "Dirt") {
                    const dirtData = picked?.gameObject.GetAirshipComponent<CropTile>()?.getCoords() as String[];
                    const distanceToPlayer = Vector3.Distance(Game.localPlayer.character!.transform.position, picked.transform.position);

                    if (distanceToPlayer > 1.5) {
                        return;
                    } else if (distanceToPlayer < 0.5) {
                        return;
                    }

                    if (this.shouldStay) {
                        return;
                    }

                    let item = "none";
                    Airship.Inventory.ObserveLocalHeldItem((itemStack) => {
                        item = itemStack?.itemDef.itemType || "none";
                    });

                    PlotManager.Get().sendDirtSignal(
                        this.yourPlotIndex,
                        tonumber(dirtData[1]) || 0,
                        tonumber(dirtData[2]) || 0,
                        tonumber(dirtData[3]) || 0,
                        tonumber(dirtData[4]) || 0,
                        item,
                        "none",
                        Game.localPlayer.userId
                    )

                    const dirtPos = picked.transform.position;
                    const characterPos = Game.localPlayer.character!.transform.position;

                    const direction = Vector3.Normalize(
                        new Vector3(dirtPos.x - characterPos.x, 0, dirtPos.z - characterPos.z)
                    );

                    const _lookRotation = Quaternion.LookRotation(direction);

                    if (item !== "none") {
                        // rotate character towards clicked dirt
                        Game.localPlayer.character!.movement.graphicTransform.rotation = _lookRotation;
                        Game.localPlayer.character!.movement.SetLookVector(direction);

                        this.stayPos = Game.localPlayer.character!.movement.graphicTransform.position;
                        this.stayRot = Game.localPlayer.character!.movement.graphicTransform.rotation;
                        this.shouldStay = true;
                    } else {
                        return;
                    }

                    if (item === "Hoe") {
                        Game.localPlayer.character?.animationHelper.PlayAnimation(this.hoeDigAnim!, CharacterAnimationLayer.OVERRIDE_1, 0.1);
                    } else if (item === "CarrotSeed") {
                        Game.localPlayer.character?.animationHelper.PlayAnimation(this.seedAnim!, CharacterAnimationLayer.OVERRIDE_1, 0.1);
                    }
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

    public getCameraRig(): GameObject {
        return this.cameraRig;
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