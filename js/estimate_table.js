(function ($, Drupal, once) {

  // Provide ajax command to refresh the view.
  Drupal.AjaxCommands.prototype.refresh_loocc_estimates = function (ajax, response, status) {
    $('.view-farm-loocc-estimates').trigger('RefreshView');
  };

  Drupal.behaviors.farm_loocc_estimate_table = {
    csrfToken: null,
    attach: function (context, settings) {

      // Get a csrfToken once.
      if (!this.csrfToken) {
        this.csrfToken = 'blah';
        $.ajax({
          async: false,
          url: Drupal.url('session/token'),
          success(data) {
            if (data) {
              this.csrfToken = data
            }
          },
        });
      }

      // Function to update values when the method is changed.
      const updateSelection = function(element) {

        // Get all estimate data.
        const estimates = JSON.parse(element.getAttribute('data-method-estimates'));

        // Get the selected estimate data.
        const value = element.options[element.selectedIndex].value;
        const estimate = estimates.find(method => method.method_id === value);

        // Find the columns cells we will update.
        const row = element.closest('tr');

        // Only enable the caron input if soc-measure is selected.
        const currentCarbonColumn = row.querySelector('.column-current-carbon input');
        const targetCarbonColumn = row.querySelector('.column-target-carbon input');
        if (value !== 'soc-measure') {
          currentCarbonColumn.setAttribute('disabled', 'true');
          targetCarbonColumn.setAttribute('disabled', 'true');
        } else {
          currentCarbonColumn.removeAttribute('disabled');
          targetCarbonColumn.removeAttribute('disabled');
        }

        const accuColumn = row.querySelector('.column-method-accu');

        // Display the estimate annual ACCUs.
        accuColumn.textContent = parseInt(estimate.annual).toLocaleString();

        const lrfCobenefits = {
          'great_barrier_reef': 'Great barrier reef',
          'coastal_ecosystems': 'Coastal ecosystems',
          'wetlands': 'Wetlands',
          'threatened_ecosystems': 'Threatened ecosystems',
          'threatened_wildlife': 'Threatened wildlife',
          'native_vegetation': 'Native vegetation',
          'summary': 'Summary',
        };

        // Build a select for the method's LRF cobenefits.
        // Only update the LRF methods if the column exists.
        // Projects outside of queensland will not have this column.
        const lrfColumn = row.querySelector('.column-method-lrf');
        if (lrfColumn) {
          if (estimate.summary) {

            // Create select.
            var select = document.createElement('select');
            select.classList.add(...['form-select', 'form-element', 'form-element--type-select']);

            // Add each benefits value as an option.
            for (const [key, value] of Object.entries(lrfCobenefits)) {
              var option = document.createElement('option');
              option.value = key;
              option.text = `${value}: ${estimate[key]}`
              select.appendChild(option);
            }

            // @todo Use element.replaceChildren() once browsers support this.
            lrfColumn.innerHTML = '';
            lrfColumn.appendChild(select);
          }
          else {
            lrfColumn.innerHTML = 'N/A';
          }
        }
      };

      // Update the method values on change.
      once('estimate_table', '.view-farm-loocc-estimates td.views-field-accu-estimates select', context).forEach(function (element) {
        element.addEventListener('change', function (event) {
          updateSelection(event.currentTarget);
        });

        // Update the values on first load.
        updateSelection(element);

        // Build an ajax object on the select element to update the selected method.
        const estimate_id = element.getAttribute('data-estimate-id');
        const url = Drupal.url(`looc-c/estimates/${estimate_id}/update?token=${this.csrfToken}`);
        const elementSettings = {
          url,
          element,
          progress: {
            type: 'none',
          },
          event: 'change',
        };
        const ajax = Drupal.ajax(elementSettings);

        // Add to the beforeSerialize function to include the select's current value in the form data.
        ajax.beforeSerialize = function (element, options) {
          Drupal.Ajax.prototype.beforeSerialize(element, options);
          options.data.method_id = element.options[element.selectedIndex].value;
        }
      });

      // Display the update link when carbon values are changed.
      once('estimate_table', '.view-farm-loocc-estimates td.column-current-carbon input, .view-farm-loocc-estimates td.column-target-carbon input', context).forEach(function (element) {
        element.addEventListener('change', function (event) {
          const row = element.closest('tr');
          const updateLink = row.querySelector('a.update-estimate');
          updateLink.classList.add('active');
        });
      });

      // Add an ajax event to the update estimate button.
      once('estimate_table', '.view-farm-loocc-estimates td a.update-estimate', context).forEach(function (element) {

        // Disable clicks.
        element.setAttribute('onclick', 'return false;');

        // Build an ajax object on the update estimate link.
        const estimate_id = element.getAttribute('data-estimate-id');
        const path = element.getAttribute('href');
        const url = `${path}?token=${this.csrfToken}`;
        const elementSettings = {
          url,
          element,
          progress: {
            type: 'throbber',
          },
          event: 'click',
        };
        const ajax = Drupal.ajax(elementSettings);

        // Add to the beforeSerialize method to include the carbon % values.
        ajax.beforeSerialize = function (element, options) {
          Drupal.Ajax.prototype.beforeSerialize(element, options);
          const row = element.closest('tr');
          const carbonAverage = row.querySelector('td.column-current-carbon input').value
          const carbonTarget = row.querySelector('td.column-target-carbon input').value
          options.data.carbon_average = carbonAverage;
          options.data.carbon_target = carbonTarget;
        }
      });
    },
  };
}(jQuery, Drupal, once));
