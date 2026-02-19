if (!customElements.get('product-info')) {
  customElements.define(
    'product-info',
    class ProductInfo extends HTMLElement {
      constructor() {
        super();
        this.input = this.querySelector('.quantity__input');
        this.currentVariant = this.querySelector('.product-variant-id');
        this.submitButton = this.querySelector('[type="submit"]');
        this.onQuantityChange = this.onQuantityChange.bind(this);
      }

      cartUpdateUnsubscriber = undefined;
      variantChangeUnsubscriber = undefined;

      connectedCallback() {
        if (!this.input) return;
        this.quantityForm = this.querySelector('.product-form__quantity');
        if (!this.quantityForm) return;
        this.setQuantityBoundries();
        this.initQuantityPriceTotal();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;
          if (event.data.sectionId !== sectionId) return;
          this.updateQuantityRules(event.data.sectionId, event.data.html);
          this.setQuantityBoundries();
        });
      }

      disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }
        if (this.variantChangeUnsubscriber) {
          this.variantChangeUnsubscriber();
        }
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: this.input.dataset.cartQuantity ? parseInt(this.input.dataset.cartQuantity) : 0,
          min: this.input.dataset.min ? parseInt(this.input.dataset.min) : 1,
          max: this.input.dataset.max ? parseInt(this.input.dataset.max) : null,
          step: this.input.step ? parseInt(this.input.step) : 1,
        };

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.input.min = min;
        this.input.max = max;
        this.input.value = min;
        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
        this.updateTotalPrice();
      }

      initQuantityPriceTotal() {
        if (!this.input) return;
        // Update price when quantity changes (on product page and in quick-add modal)
        this.input.addEventListener('change', this.onQuantityChange);
        this.input.addEventListener('input', this.onQuantityChange);
        this.updateTotalPrice();
      }

      onQuantityChange() {
        this.updateTotalPrice();
      }

      updateTotalPrice() {
        if (!this.input) return;

        const priceWrapper = this.querySelector('.price');
        if (!priceWrapper) return;

        // Skip if volume pricing is configured – price-per-item component already handles that display.
        if (priceWrapper.dataset.hasVolumePricing === 'true') return;

        const unitPriceCents = parseInt(priceWrapper.dataset.unitPrice);
        if (isNaN(unitPriceCents)) return;

        const quantity = parseInt(this.input.value) || 1;
        const totalCents = unitPriceCents * quantity;

        const moneyFormat = priceWrapper.dataset.moneyFormat;
        const currency = priceWrapper.dataset.currency;

        let formattedTotal;
        if (window.Shopify && typeof Shopify.formatMoney === 'function' && moneyFormat) {
          formattedTotal = Shopify.formatMoney(totalCents, moneyFormat);
        } else {
          const options = currency ? { style: 'currency', currency } : undefined;
          const formatter = options ? new Intl.NumberFormat(undefined, options) : null;
          formattedTotal = formatter ? formatter.format(totalCents / 100) : (totalCents / 100).toFixed(2);
        }

        priceWrapper
          .querySelectorAll('.price-item--regular, .price-item--sale')
          .forEach((el) => {
            el.textContent = formattedTotal;
          });
      }

      fetchQuantityRules() {
        if (!this.currentVariant || !this.currentVariant.value) return;
        this.querySelector('.quantity__rules-cart .loading__spinner').classList.remove('hidden');
        fetch(`${this.dataset.url}?variant=${this.currentVariant.value}&section_id=${this.dataset.section}`)
          .then((response) => {
            return response.text();
          })
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            this.updateQuantityRules(this.dataset.section, html);
            this.setQuantityBoundries();
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.querySelector('.quantity__rules-cart .loading__spinner').classList.add('hidden');
          });
      }

      updateQuantityRules(sectionId, html) {
        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if (!current || !updated) continue;
          if (selector === '.quantity__input') {
            const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if (valueUpdated !== null) current.setAttribute(attribute, valueUpdated);
            }
          } else {
            current.innerHTML = updated.innerHTML;
          }
        }
      }
    }
  );
}
