/**
 * 
 * @param {(container: HTMLElement, lines: Array<string>, testCases: number) => void} testCaseCallback Callback to handle each test case.
 * @returns {void}
 */
function loadFile(testCasesCallback) {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert('Please select a file first.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const testCases = parseInt(lines[0]);
    const container = document.getElementById('cases');
    container.innerHTML = '';

    testCasesCallback(container, lines, testCases);
  }
  reader.readAsText(file);
}

window.loadFile = loadFile;
