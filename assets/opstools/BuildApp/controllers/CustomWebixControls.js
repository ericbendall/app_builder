
steal(
    // List your Controller's dependencies here:
    function () {
        System.import('appdev').then(function () {
            steal.import('appdev/ad',
                'appdev/control/control').then(function () {

                    // Namespacing conventions:
                    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
                    AD.Control.extend('opstools.BuildApp.CustomWebixControls', {


                        init: function (element, options) {
                            var self = this;
                            options = AD.defaults({
                            }, options);
                            this.options = options;

                            // Call parent init
                            this._super(element, options);


                            this.dataSource = this.options.dataSource; // AD.models.Projects;

                            this.initWebixControls();
                        },

                        initWebixControls: function () {
                            // Webix list editable
                            webix.protoUI({
                                name: "editlist"
                            }, webix.EditAbility, webix.ui.list);

                            // Webix datatable filter
                            webix.protoUI({
                                name: "filter_popup",
                                $init: function (config) {
                                    //functions executed on component initialization
                                    this.fieldList = [];
                                    this.combineCondition = 'And';
                                },
                                defaults: {
                                    width: 800,
                                    body: {
                                        view: "form",
                                        autoheight: true,
                                        elements: [{
                                            view: "button", value: "Add a filter", click: function () {
                                                this.getTopParentView().addNewFilter();
                                            }
                                        }]
                                    }
                                },
                                addNewFilter: function () {
                                    var _this = this;
                                    var viewIndex = _this.getBody().getChildViews().length - 1;

                                    _this.getBody().addView({
                                        cols: [
                                            {
                                                view: "combo", value: _this.combineCondition, options: ["And", "Or"], css: 'combine-condition', width: 80, on: {
                                                    "onChange": function (newValue, oldValue) {
                                                        _this.combineCondition = newValue;

                                                        var filterList = $('.combine-condition').webix_combo();

                                                        if ($.isArray(filterList)) {
                                                            filterList.forEach(function (elm) {
                                                                elm.setValue(newValue);
                                                            });
                                                        }
                                                        else {
                                                            filterList.setValue(newValue);
                                                        }

                                                        _this.filter();
                                                    }
                                                }
                                            },
                                            {
                                                view: "combo", options: _this.fieldList, on: {
                                                    "onChange": function (columnId) {
                                                        var columnConfig = _this.dataTable.getColumnConfig(columnId);
                                                        var conditionList = [];
                                                        var inputView = {};

                                                        switch (columnConfig.filter_type) {
                                                            case "text":
                                                                conditionList = [
                                                                    "contains",
                                                                    "doesn't contain",
                                                                    "is",
                                                                    "is not"
                                                                ];

                                                                inputView = { view: "text" };
                                                                break;
                                                            case "date":
                                                                conditionList = [
                                                                    "is before",
                                                                    "is after",
                                                                    "is on or before",
                                                                    "is on or after"
                                                                ];

                                                                inputView = { view: "datepicker" };

                                                                if (columnConfig.format)
                                                                    inputView.format = columnConfig.format;

                                                                break;
                                                            case "number":
                                                                conditionList = [
                                                                    "=",
                                                                    "≠",
                                                                    "<",
                                                                    ">",
                                                                    "≤",
                                                                    "≥"
                                                                ];

                                                                inputView = { view: "text", validate: webix.rules.isNumber };
                                                                break;
                                                            case "list":
                                                                conditionList = [
                                                                    "equals",
                                                                    "does not equal"
                                                                ];

                                                                inputView = {
                                                                    view: "multicombo",
                                                                    options: columnConfig.filter_options
                                                                };
                                                                break;
                                                        }

                                                        var conditionCombo = this.getParentView().getChildViews()[2];
                                                        conditionCombo.define("options", conditionList);
                                                        conditionCombo.refresh();

                                                        this.getParentView().removeView(this.getParentView().getChildViews()[3]);
                                                        this.getParentView().addView(inputView, 3);
                                                        if (columnConfig.filter_type === 'text')
                                                            this.getParentView().getChildViews()[3].attachEvent("onTimedKeyPress", function () { _this.filter(); });
                                                        else
                                                            this.getParentView().getChildViews()[3].attachEvent("onChange", function () { _this.filter(); });

                                                        _this.filter();
                                                    }
                                                }
                                            },
                                            { view: "combo", options: [], width: 155, on: { "onChange": function () { _this.filter(); } } },
                                            {},
                                            {
                                                view: "button", value: "X", width: 30, click: function () {
                                                    this.getFormView().removeView(this.getParentView());
                                                    _this.filter();
                                                }
                                            }
                                        ]
                                    }, viewIndex);
                                },
                                registerDataTable: function (dataTable) {
                                    var _this = this;
                                    _this.dataTable = dataTable;
                                    _this.dataTable.eachColumn(function (columnId) {
                                        var columnConfig = _this.dataTable.getColumnConfig(columnId);
                                        if (columnConfig.filter_type && columnConfig.header && columnConfig.header.length > 0 && columnConfig.header[0].text) {
                                            _this.fieldList.push({
                                                id: columnId,
                                                value: columnConfig.header[0].text
                                            });
                                        }
                                    });

                                    this.addNewFilter();
                                },
                                filter: function () {
                                    var _this = this;

                                    var filterCondition = [];

                                    _this.getChildViews()[0].getChildViews().forEach(function (view, index, viewList) {
                                        if (index < viewList.length - 1) { // Ignore 'Add a filter' button
                                            if (view.getChildViews()[1].getValue() && view.getChildViews()[2].getValue() && view.getChildViews()[3].getValue()) {
                                                filterCondition.push({
                                                    combineCondtion: view.getChildViews()[0].getValue(),
                                                    fieldName: view.getChildViews()[1].getValue(),
                                                    operator: view.getChildViews()[2].getValue(),
                                                    inputValue: view.getChildViews()[3].getValue(),
                                                });
                                            }
                                        }
                                    });

                                    _this.dataTable.filter(function (obj) {
                                        var combineCond = (filterCondition && filterCondition.length > 0 ? filterCondition[0].combineCondtion : 'And');
                                        var isValid = (combineCond === 'And' ? true : false);

                                        filterCondition.forEach(function (cond) {
                                            var condResult;
                                            var objValue = _this.dataTable.getColumnConfig(cond.fieldName).filter_value ? _this.dataTable.getColumnConfig(cond.fieldName).filter_value(obj) : obj[cond.fieldName];

                                            switch (cond.operator) {
                                                // Text filter
                                                case "contains":
                                                    condResult = objValue.trim().toLowerCase().indexOf(cond.inputValue.trim().toLowerCase()) > -1;
                                                    break;
                                                case "doesn't contain":
                                                    condResult = objValue.trim().toLowerCase().indexOf(cond.inputValue.trim().toLowerCase()) < 0;
                                                    break;
                                                case "is":
                                                    condResult = objValue.trim().toLowerCase() == cond.inputValue.trim().toLowerCase();
                                                    break;
                                                case "is not":
                                                    condResult = objValue.trim().toLowerCase() != cond.inputValue.trim().toLowerCase();
                                                    break;
                                                // Date filter
                                                case "is before":
                                                    if (!(objValue instanceof Date)) objValue = new Date(objValue);
                                                    condResult = objValue < cond.inputValue;
                                                    break;
                                                case "is after":
                                                    if (!(objValue instanceof Date)) objValue = new Date(objValue);
                                                    condResult = objValue > cond.inputValue;
                                                    break;
                                                case "is on or before":
                                                    if (!(objValue instanceof Date)) objValue = new Date(objValue);
                                                    condResult = objValue <= cond.inputValue;
                                                    break;
                                                case "is on or after":
                                                    if (!(objValue instanceof Date)) objValue = new Date(objValue);
                                                    condResult = objValue >= cond.inputValue;
                                                    break;
                                                // Number filter
                                                case "=":
                                                    condResult = Number(objValue) == Number(cond.inputValue);
                                                    break;
                                                case "≠":
                                                    condResult = Number(objValue) != Number(cond.inputValue);
                                                    break;
                                                case "<":
                                                    condResult = Number(objValue) < Number(cond.inputValue);
                                                    break;
                                                case ">":
                                                    condResult = Number(objValue) > Number(cond.inputValue);
                                                    break;
                                                case "≤":
                                                    condResult = Number(objValue) <= Number(cond.inputValue);
                                                    break;
                                                case "≥":
                                                    condResult = Number(objValue) >= Number(cond.inputValue);
                                                    break;
                                                // List filter
                                                case "equals":
                                                    condResult = cond.inputValue.toLowerCase().indexOf(objValue.trim().toLowerCase()) > -1;
                                                    break;
                                                case "does not equal":
                                                    condResult = cond.inputValue.toLowerCase().indexOf(objValue.trim().toLowerCase()) < 0;
                                                    break;
                                            }
                                            if (combineCond === 'And') {
                                                isValid = isValid && condResult;
                                            } else {
                                                isValid = isValid || condResult;
                                            }
                                        });

                                        return isValid;
                                    })
                                }
                            }, webix.ui.popup);

                            // Webix add new datable columns
                            webix.protoUI({
                                name: "add_fields_popup",
                                $init: function (config) {
                                    this.fieldList = [];
                                    this.combineCondition = 'And';
                                },
                                defaults: {
                                    height: 300,
                                    ready: function () {
                                        $$("ab-new-none").show();
                                    },
                                    body: {
                                        width: 380,
                                        rows: [
                                            {
                                                view: "menu",
                                                data: [
                                                    {
                                                        value: "Choose field type...",
                                                        submenu: [
                                                            { view: 'button', value: 'Single line text', icon: 'font', type: 'icon', viewName: 'ab-new-singleText' },
                                                            { view: 'button', value: 'Long text', icon: 'align-right', type: 'icon', viewName: 'ab-new-longText' },
                                                            { view: 'button', value: 'Number', icon: 'slack', type: 'icon', viewName: 'ab-new-number' },
                                                            { view: 'button', value: 'Date', icon: 'calendar', type: 'icon', viewName: 'ab-new-date' },
                                                            { view: 'button', value: 'Checkbox', icon: 'check-square-o', type: 'icon', viewName: 'ab-new-boolean' },
                                                            { view: 'button', value: 'Attachment', icon: 'file', type: 'icon', viewName: 'ab-new-attachment' },
                                                        ]
                                                    }
                                                ],
                                                on: {
                                                    onMenuItemClick: function (id) {
                                                        if (this.getMenuItem(id).viewName)
                                                            $$(this.getMenuItem(id).viewName).show();
                                                    }
                                                }
                                            },
                                            { height: 10 },
                                            {
                                                cells: [
                                                    {
                                                        id: "ab-new-none",
                                                        rows: [{ view: "label", label: "Choose field type..." }]
                                                    },
                                                    {
                                                        id: "ab-new-singleText",
                                                        rows: [
                                                            { view: "label", label: "<span class='webix_icon fa-font'></span>Single line text" },
                                                            { view: "text", placeholder: "Default text" }
                                                        ]
                                                    },
                                                    {
                                                        id: "ab-new-longText",
                                                        rows: [
                                                            { view: "label", label: "<span class='webix_icon fa-align-right'></span>Long line text" },
                                                            { view: "label", label: "A long text field that can span multiple lines." }
                                                        ]
                                                    },
                                                    {
                                                        id: "ab-new-number",
                                                        rows: [
                                                            { view: "label", label: "<span class='webix_icon fa-slack'></span>Number" },
                                                            { view: "checkbox", labelRight: "Allow decimal numbers", labelWidth: 0 },
                                                            { view: "text", placeholder: "Default number" }
                                                        ]
                                                    },
                                                    {
                                                        id: "ab-new-date",
                                                        rows: [
                                                            { view: "label", label: "<span class='webix_icon fa-calendar'></span>Date" },
                                                            { view: "label", label: "Pick one from a calendar." },
                                                            { view: "checkbox", labelRight: "Include time", labelWidth: 0 },
                                                        ]
                                                    },
                                                    {
                                                        id: "ab-new-boolean",
                                                        rows: [
                                                            { view: "label", label: "<span class='webix_icon fa-check-square-o'></span>Checkbox" },
                                                            { view: "label", label: "A single checkbox that can be checked or unchecked." }
                                                        ]
                                                    },
                                                    {
                                                        id: "ab-new-attachment",
                                                        rows: [
                                                            { view: "label", label: "<span class='webix_icon fa-file'></span>Attachment" },
                                                            { view: "label", label: "Under construction..." }
                                                        ]
                                                    }
                                                ]
                                            },
                                            { height: 10 },
                                            {
                                                cols: [
                                                    {
                                                        view: "button", label: "Add Column", type: "form", width: 120, click: function () {
                                                            // TODO : under construction to attachment 
                                                        }
                                                    },
                                                    {
                                                        view: "button", value: "Cancel", width: 100, click: function () {
                                                            this.getTopParentView().hide();
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    on: {
                                        onHide: function () {
                                            // TODO : Reset state
                                        }
                                    }
                                },
                            }, webix.ui.popup);
                        }


                    });

                });
        });

    });