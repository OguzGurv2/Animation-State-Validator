/**
 * Return [presetKey, definition] entries for a specific animation name.
 */
export function getPresetsForAnimation(definitions, animName) {
  return Object.entries(definitions).filter(
    ([, definition]) => definition.animationName === animName,
  );
}

/**
 * Choose a preset key for an animation, prioritizing idle.json when available.
 */
export function getPreferredPresetFromDefinitions(definitions, animName) {
  const presetsForAnimation = getPresetsForAnimation(definitions, animName);

  if (!presetsForAnimation.length) {
    return null;
  }

  const idlePreset = presetsForAnimation.find(([, definition]) =>
    /^idle\.json$/i.test(definition.fileName),
  );
  if (idlePreset) {
    return idlePreset[0];
  }

  return presetsForAnimation[0][0];
}

/**
 * Select the app-level default preset from the first known animation.
 */
export function getDefaultPresetFromDefinitions(definitions) {
  const animationNames = [
    ...new Set(
      Object.values(definitions).map((definition) => definition.animationName),
    ),
  ];

  if (!animationNames.length) {
    return null;
  }

  return getPreferredPresetFromDefinitions(definitions, animationNames[0]);
}

/**
 * Determine which animation should remain active after a delete operation.
 */
export function getNextAnimationAfterDelete({
  remainingAnimations,
  wasSelected,
  selectedAnimation,
}) {
  if (!remainingAnimations.length) {
    return null;
  }

  if (wasSelected) {
    return remainingAnimations[0];
  }

  return selectedAnimation ?? remainingAnimations[0];
}
