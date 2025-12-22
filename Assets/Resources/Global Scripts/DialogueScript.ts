export default class DialogueScript extends AirshipBehaviour {
	public icon: RawImage;
	public iconTexture: Texture2D;
	public name: TMP_Text;
	public message: TMP_Text;
	public sound: AudioSource;

	public var1_text: TMP_Text;
	public var2_text: TMP_Text;

	public var1_button: Button;
	public var2_button: Button;

	public variantGroup: CanvasGroup;

	private timer: number;
	private shouldUpdate: boolean = false;
	private newText: string;
	private maxTime: number;
	private messageText: string

	private closeTimer: number;
	private closeTime: number;
	private afterFinish: boolean = false;

	private func: () => void;

	@Client()
	override Start(): void {
		this.Test();

		this.icon.texture = this.iconTexture;

		this.gameObject.GetComponent<RectTransform>()!.anchoredPosition = new Vector2(0, 230);
	}

	@Client()
	override Update(dt: number): void {
		if (this.shouldUpdate) {
			// Calculate number of symbols that should be shown using timer.
			const numSymbols  = math.round((this.timer / this.maxTime) * this.newText.size());

			// create new string with only the symbols that should be shown
			let newText = "";
			let latestSymbol = "";
			for (let i = 0; i < numSymbols; i++) {
				newText += this.newText.sub(i, i); // get the symbol at index i

				latestSymbol = this.newText.sub(i, i);
			}

			if (this.messageText !== newText && latestSymbol !== " ") {
				this.sound.Play();
			}

			this.message.text = newText;
			this.messageText = newText;

			this.timer += dt;
			if (this.timer >= this.maxTime) {
				this.shouldUpdate = false;

				this.finish();
			}
		}

		if (!this.shouldUpdate) {
			if (this.closeTimer >= this.closeTime) {
				this.hide();

				if (this.afterFinish) {
					this.func();
				}
			}

			this.closeTimer += dt;
		}
	}

	@Client()
	finish(): void {
		this.timer = 0;
		this.message.text = this.newText;
		this.messageText = this.newText;

		this.newText = "";
		this.maxTime = 0;
		this.sound.Play();

		if (!this.afterFinish) {
			this.func();
		}

		// only for testing purposes
		//this.writeText("Hello world! I love cats! WOOOoOOOoOoO!", false, 3);
	}

	@Client()
	writeText(text: string, finish: boolean = false, time: number = 0.5, closeTime: number = 3, func: () => void = () => {}, afterFinish: boolean = false): void {
		this.show();
		this.func = func;
		this.afterFinish = afterFinish;

		if (finish) {
			this.finish();
		} else {
			this.shouldUpdate = true;
			this.timer = 0;
			this.maxTime = time;
			this.closeTime = closeTime;
			this.closeTimer = 0;

			this.newText = text;
		}
	}

	@Client()
	hide(): void {
		this.icon.enabled = false;
		this.name.enabled = false;
		this.message.enabled = false;
		this.gameObject.SetActive(false);

		this.var1_button.enabled = false;
		this.var2_button.enabled = false;

		this.hideVariants();
	}

	@Client()
	show(): void {
		this.icon.enabled = true;
		this.name.enabled = true;
		this.message.enabled = true;
		this.gameObject.SetActive(true);
	}

	@Client()
	setVariant1(first: string, firstFunc: () => void): void {
		this.var1_text.text = first;
		this.var1_button.onClick.DisconnectAll();
		this.var1_button.onClick.Connect(firstFunc);
	}

	@Client()
	setVariant2(second: string, secondFunc: () => void): void {
		this.var2_text.text = second;
		this.var2_button.onClick.DisconnectAll();
		this.var2_button.onClick.Connect(secondFunc);
	}

	@Client()
	hideVariants(): void {
		this.var1_button.enabled = false;
		this.var2_button.enabled = false;

		this.variantGroup.alpha = 0;
		this.variantGroup.interactable = false;
	}

	@Client()
	showVariants(): void {
		this.var1_button.enabled = true;
		this.var2_button.enabled = true;
		
		this.variantGroup.alpha = 1;
		this.variantGroup.interactable = true;
	}

	@Client()
	setImage(image: Texture2D): void {
		this.iconTexture = image;

		this.icon.texture = this.iconTexture;
	}

	@Client()
	setName(name: string): void {
		this.name.text = name;
	}

	// test function
	@Client()
	Test(): void {
		print("DialogueScript: Test");

		this.writeText("Hello world! I love cats!", false, 0, 0);
		this.name.text = "CAT";

		this.setVariant1("CAT!!!", () => {
			print("YEAHHH!!!");
		});

		this.setVariant2("CAT???", () => {
			print("YEAHHH???");
		});
	}
}
