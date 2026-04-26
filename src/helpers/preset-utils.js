export function getPresetsForAnimation(definitions, animName) {
  return Object.entries(definitions).filter(
    ([, definition]) => definition.animationName === animName,
  );
}

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
