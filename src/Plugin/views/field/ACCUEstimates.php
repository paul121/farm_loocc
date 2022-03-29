<?php

namespace Drupal\farm_loocc\Plugin\views\field;

use Drupal\views\Plugin\views\display\DisplayPluginBase;
use Drupal\views\Plugin\views\field\PrerenderList;
use Drupal\views\ResultRow;
use Drupal\views\ViewExecutable;

/**
 * Custom views field that renders a list of ACCU estimates.
 *
 * @ViewsField("farm_loocc_accu_estimates")
 */
class ACCUEstimates extends PrerenderList {

  /**
   * {@inheritdoc}
   */
  public function init(ViewExecutable $view, DisplayPluginBase $display, array &$options = NULL) {
    parent::init($view, $display, $options);
    $this->accuEstimates = $this->getAccuEstimates();
  }

  /**
   * {@inheritdoc}
   */
  public function query() {
    // Overwrite the query method to do nothing.
  }

  /**
   * {@inheritdoc}
   */
  public function render_item($count, $item) { // phpcs:ignore
    return $item['method_id'] . ': ' . $item['annual'] . ' (' . $item['project'] . ')';
  }

  /**
   * {@inheritdoc}
   */
  public function getItems(ResultRow $values) {
    $id = $values->farm_loocc_estimate_id;
    $estimates = $this->accuEstimates[$id] ?? [];
    return $estimates;
  }

  /**
   * Helper function to get mapped ACCU estimates.
   *
   * @return array
   *   Arrays of accu estimates keyed by the base estimate id.
   */
  protected function getAccuEstimates(): array {

    // Query all accu estimates.
    $accu_estimates = \Drupal::database()->select('farm_loocc_accu_estimate', 'flae')
      ->fields('flae', ['estimate_id', 'method_id', 'annual', 'project', 'warning_message'])
      ->orderBy('flae.estimate_id')
      ->execute();

    // Map each accu estimate to the estimate id.
    $all_estimates = [];
    foreach ($accu_estimates as $result) {
      $id = $result->estimate_id;
      $all_estimates[$id][] = (array) $result;
    }

    return $all_estimates;
  }

}