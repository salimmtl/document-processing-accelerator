var DocumentProcessing = (function () {
  var STATUS_ATTR = 'dpa_processingstatus';
  var FILE_ATTR = 'dpa_sourcedocument';
  var NOTIFY_ID = 'dpa_readytoprocess_requires_document';

  function optionValue(attr, label) {
    if (!attr || !attr.getOptions) { return null; }
    var opts = attr.getOptions() || [];
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].text === label) { return opts[i].value; }
    }
    return null;
  }

  function hasDocument(formCtx) {
    var names = [FILE_ATTR, FILE_ATTR + '_name'];
    var found = false;
    for (var i = 0; i < names.length; i++) {
      var a = formCtx.getAttribute(names[i]);
      if (a) {
        found = true;
        var v = a.getValue();
        if (v !== null && v !== undefined && v !== '') { return true; }
      }
    }
    if (!found) { return true; }
    return false;
  }

  function clearNotification(formCtx) {
    var ctrl = formCtx.getControl(STATUS_ATTR);
    if (ctrl && ctrl.clearNotification) { ctrl.clearNotification(NOTIFY_ID); }
  }

  function onSave(executionContext) {
    var formCtx = executionContext.getFormContext();
    var statusAttr = formCtx.getAttribute(STATUS_ATTR);
    if (!statusAttr) { return; }
    clearNotification(formCtx);

    var readyValue = optionValue(statusAttr, 'Ready to Process');
    if (readyValue === null) { return; }
    if (statusAttr.getValue() !== readyValue) { return; }
    if (hasDocument(formCtx)) { return; }

    var args = executionContext.getEventArgs();
    if (args && args.preventDefault) { args.preventDefault(); }
    var ctrl = formCtx.getControl(STATUS_ATTR);
    if (ctrl && ctrl.setNotification) {
      ctrl.setNotification('Attach a source document before setting this record to Ready to Process.', NOTIFY_ID);
    }
  }

  function onStatusChange(executionContext) {
    clearNotification(executionContext.getFormContext());
  }

  return { onSave: onSave, onStatusChange: onStatusChange };
})();
