sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/ui/core/library"
], function (Controller, JSONModel, MessageBox, MessageToast, SelectDialog, StandardListItem, coreLibrary) {
    "use strict";

    var ValueState = coreLibrary.ValueState;

    return Controller.extend("zyeg.controller.FactureCreate", {
        onInit: function () {
            this._oODataModel = this.getOwnerComponent().getModel();
            var oCreateModel = new JSONModel({
                busy: false,
                clients: [],
                voitures: [],
                Clientid: "",
                Clientfullname: "",
                Voitureid: "",
                Amount: "",
                Devise: "EUR"
            });

            oCreateModel.setDefaultBindingMode("TwoWay");
            this.getView().setModel(oCreateModel, "create");

            this.byId("createPage").addStyleClass("zyegCreatePage");
            this.byId("createContentBox").addStyleClass("zyegFormCard");
            this.byId("createActionRow").addStyleClass("zyegFormActions");

            this.getOwnerComponent().getRouter().getRoute("RouteFactureCreate").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this._resetForm();
            this._loadValueHelp();
        },

        _resetForm: function () {
            var oModel = this.getView().getModel("create");

            oModel.setProperty("/busy", false);
            oModel.setProperty("/Clientid", "");
            oModel.setProperty("/Clientfullname", "");
            oModel.setProperty("/Voitureid", "");
            oModel.setProperty("/Amount", "");
            oModel.setProperty("/Devise", "EUR");
        },

        _loadValueHelp: function () {
            var oModel = this.getView().getModel("create");

            oModel.setProperty("/busy", true);

            Promise.all([
                this._readEntity("/ZI_YEG_CLIENT"),
                this._readEntity("/ZI_YEG_VOITURE")
            ]).then(function (aResults) {
                oModel.setProperty("/clients", aResults[0]);
                oModel.setProperty("/voitures", [{ Id: "", Matricule: "Aucune", Marque: "" }].concat(aResults[1]));
                oModel.setProperty("/busy", false);
            }).catch(function () {
                oModel.setProperty("/busy", false);
                MessageBox.error("Impossible de charger les donnees de selection.");
            });
        },

        _readEntity: function (sEntitySet) {
            return new Promise(function (resolve, reject) {
                this._oODataModel.read(sEntitySet, {
                    urlParameters: {
                        "$top": 1000
                    },
                    success: function (oData) {
                        resolve((oData && oData.results) ? oData.results : []);
                    },
                    error: reject
                });
            }.bind(this));
        },

        onClientChange: function (oEvent) {
            var sClientId = oEvent.getSource().getSelectedKey();
            var oModel = this.getView().getModel("create");
            var aClients = oModel.getProperty("/clients") || [];
            var oClient = aClients.find(function (oRow) {
                return String(oRow.Id) === String(sClientId);
            });

            oModel.setProperty("/Clientid", sClientId);
            oModel.setProperty("/Clientfullname", oClient ? ((oClient.Prenom || "") + " " + (oClient.Nom || "")).trim() : "");
            oEvent.getSource().setValueState(ValueState.None);
            oEvent.getSource().setValueStateText("");
        },

        onCreateClientValueHelp: function () {
            var oModel = this.getView().getModel("create");
            var aClients = oModel.getProperty("/clients") || [];
            var aItems = aClients.map(function (oClient) {
                var sName = ((oClient.Prenom || "") + " " + (oClient.Nom || "")).trim();

                return {
                    key: String(oClient.Id || ""),
                    title: sName || String(oClient.Id || ""),
                    description: String(oClient.Id || "")
                };
            });

            this._openSimpleValueHelpDialog("Selectionner un client", aItems, function (oItem) {
                var oClient = aClients.find(function (oRow) {
                    return String(oRow.Id) === String(oItem.key);
                });

                oModel.setProperty("/Clientid", oItem.key);
                oModel.setProperty("/Clientfullname", oClient ? ((oClient.Prenom || "") + " " + (oClient.Nom || "")).trim() : "");

                var oClientSelect = this.byId("createClientSelect");

                if (oClientSelect) {
                    oClientSelect.setValueState(ValueState.None);
                    oClientSelect.setValueStateText("");
                }
            }.bind(this));
        },

        onCreateClientNameValueHelp: function () {
            this.onCreateClientValueHelp();
        },

        onCreateVoitureValueHelp: function () {
            var oModel = this.getView().getModel("create");
            var aVoitures = oModel.getProperty("/voitures") || [];
            var aItems = aVoitures.map(function (oVoiture) {
                var sMatricule = oVoiture.Matricule || "";
                var sMarque = oVoiture.Marque || "";

                return {
                    key: String(oVoiture.Id || ""),
                    title: (sMatricule + (sMarque ? (" - " + sMarque) : "")).trim() || "Aucune",
                    description: String(oVoiture.Id || "")
                };
            });

            this._openSimpleValueHelpDialog("Selectionner une voiture", aItems, function (oItem) {
                oModel.setProperty("/Voitureid", oItem.key);
            });
        },

        onCreateDeviseValueHelp: function () {
            var oModel = this.getView().getModel("create");

            this._openSimpleValueHelpDialog("Selectionner une devise", this._getDeviseValueHelpItems(), function (oItem) {
                oModel.setProperty("/Devise", (oItem.key || "").toUpperCase());

                var oDeviseInput = this.byId("createDeviseInput");

                if (oDeviseInput) {
                    oDeviseInput.setValueState(ValueState.None);
                    oDeviseInput.setValueStateText("");
                }
            }.bind(this));
        },

        _getDeviseValueHelpItems: function () {
            return [
                { key: "EUR", title: "EUR", description: "Euro" },
                { key: "USD", title: "USD", description: "Dollar americain" },
                { key: "MAD", title: "MAD", description: "Dirham marocain" },
                { key: "GBP", title: "GBP", description: "Livre sterling" },
                { key: "CHF", title: "CHF", description: "Franc suisse" }
            ];
        },

        _openSimpleValueHelpDialog: function (sTitle, aItems, fnOnSelect) {
            var oDialog = new SelectDialog({
                title: sTitle,
                noDataText: "Aucune donnee",
                searchPlaceholder: "Rechercher",
                confirm: function (oEvent) {
                    var oSelectedItem = oEvent.getParameter("selectedItem");

                    if (oSelectedItem && typeof fnOnSelect === "function") {
                        var oSelectedData = oSelectedItem.getBindingContext("vh").getObject();

                        fnOnSelect(oSelectedData);
                    }

                    oDialog.destroy();
                },
                cancel: function () {
                    oDialog.destroy();
                }
            });

            oDialog.setModel(new JSONModel({ items: aItems || [] }), "vh");
            oDialog.bindAggregation("items", {
                path: "vh>/items",
                template: new StandardListItem({
                    title: "{vh>title}",
                    description: "{vh>description}",
                    info: "{vh>key}"
                })
            });

            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        onCreateFieldLiveChange: function (oEvent) {
            var oControl = oEvent.getSource();

            if (oControl) {
                oControl.setValueState(ValueState.None);
                oControl.setValueStateText("");
            }
        },

        onCreateFacture: function () {
            var oModel = this.getView().getModel("create");
            var oData = oModel.getData();
            var sAmount = this._toODataDecimal(oData.Amount, 2);
            var oPayload = {
                Clientid: oData.Clientid,
                Clientfullname: (oData.Clientfullname || "").trim(),
                Voitureid: oData.Voitureid || "",
                Amount: sAmount,
                Devise: (oData.Devise || "").trim().toUpperCase()
            };

            oModel.setProperty("/Devise", oPayload.Devise);
            var oValidation = this._validate(oPayload);

            this._clearCreateValueStates();

            if (oValidation.messages.length) {
                this._applyCreateValidationStates(oValidation.fields);
                MessageBox.error(oValidation.messages.join("\n"));
                return;
            }

            oModel.setProperty("/busy", true);
            this._oODataModel.create("/ZI_YEG_FACTURE", oPayload, {
                success: function () {
                    oModel.setProperty("/busy", false);
                    MessageToast.show("Facture creee avec succes.");
                    this.getOwnerComponent().getRouter().navTo("RouteMain", {
                        query: {
                            refresh: "X"
                        }
                    });
                }.bind(this),
                error: function () {
                    oModel.setProperty("/busy", false);
                    MessageBox.error("Echec de creation de facture.");
                }
            });
        },

        _validate: function (oPayload) {
            var aErrors = [];
            var oFieldErrors = {};
            var fAmount = Number(oPayload.Amount);

            if (!oPayload.Clientid) {
                aErrors.push("Selection du client obligatoire.");
                oFieldErrors.Clientid = "Selection du client obligatoire.";
            }

            if (!oPayload.Clientfullname) {
                aErrors.push("Nom client obligatoire.");
            }

            if (oPayload.Amount === "" || oPayload.Amount === null || Number.isNaN(fAmount) || fAmount <= 0) {
                aErrors.push("Le montant doit etre numerique et superieur a 0.");
                oFieldErrors.Amount = "Montant invalide.";
            }

            if (!oPayload.Devise) {
                aErrors.push("La devise est obligatoire.");
                oFieldErrors.Devise = "La devise est obligatoire.";
            }

            if (oPayload.Devise && oPayload.Devise.length > 5) {
                aErrors.push("La devise ne doit pas depasser 5 caracteres.");
                oFieldErrors.Devise = "Maximum 5 caracteres.";
            }

            return {
                messages: aErrors,
                fields: oFieldErrors
            };
        },

        _clearCreateValueStates: function () {
            ["createClientSelect", "createAmountInput", "createDeviseInput"].forEach(function (sId) {
                var oControl = this.byId(sId);

                if (oControl) {
                    oControl.setValueState(ValueState.None);
                    oControl.setValueStateText("");
                }
            }.bind(this));
        },

        _applyCreateValidationStates: function (oFieldErrors) {
            var mMap = {
                Clientid: "createClientSelect",
                Amount: "createAmountInput",
                Devise: "createDeviseInput"
            };

            Object.keys(oFieldErrors || {}).forEach(function (sField) {
                var oControl = this.byId(mMap[sField]);

                if (oControl) {
                    oControl.setValueState(ValueState.Error);
                    oControl.setValueStateText(oFieldErrors[sField]);
                }
            }.bind(this));
        },

        _toODataDecimal: function (vValue, iScale) {
            var sRaw = vValue === undefined || vValue === null ? "" : String(vValue).trim();

            if (!sRaw) {
                return "";
            }

            var sNormalized = sRaw.replace(/\s+/g, "").replace(",", ".");
            var fNumber = Number(sNormalized);

            if (Number.isNaN(fNumber)) {
                return "";
            }

            return fNumber.toFixed(iScale || 2);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("RouteMain");
        }
    });
});