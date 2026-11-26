// Los IDs llegan como números desde el backend y como texto desde <select>.
// Se normalizan solo para comparar, sin modificar las plantillas de MySQL.
export function findTaskTemplate(templates, id) {
  if (id === "" || id === null || id === undefined) return null;
  return templates.find((template) =>
    template && template.id !== null && template.id !== undefined
      && String(template.id) === String(id)
  ) ?? null;
}

export function getValidTaskTemplateId(templates, selectedId) {
  const selected = findTaskTemplate(templates, selectedId);
  if (selected) return String(selected.id);
  const first = templates.find((template) => template && template.id !== null && template.id !== undefined);
  return first ? String(first.id) : "";
}
