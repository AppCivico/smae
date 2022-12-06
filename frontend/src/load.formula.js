(function () {
    var myDiv = document.getElementById('jsPlaceholder');
    var myScript = document.createElement('script');
    myScript.src = __FORMULA_JS_PATH__;
    myDiv.appendChild(myScript);
})()