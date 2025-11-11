import { Mouse } from "@Easy/Core/Shared/UserInput";

export default class PlayerManager extends AirshipSingleton {
	override Start(): void {
		print("PlayerManager initialized.");

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
	}
}
