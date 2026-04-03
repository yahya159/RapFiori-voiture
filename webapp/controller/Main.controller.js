sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Button",
    "sap/m/DatePicker",
    "sap/m/Dialog",
    "sap/m/Input",
    "sap/m/Label",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/ui/core/library",
    "sap/ui/core/Fragment",
    "sap/ui/export/Spreadsheet",
    "zyeg/model/formatter"
], function (
    Controller,
    JSONModel,
    Button,
    DatePicker,
    Dialog,
    Input,
    Label,
    MessageBox,
    MessageToast,
    Text,
    VBox,
    coreLibrary,
    Fragment,
    Spreadsheet,
    formatter
) {
    "use strict";

    var ValueState = coreLibrary.ValueState;

    return Controller.extend("zyeg.controller.Main", {
        formatter: formatter,

        onInit: function () {
            this._oODataModel = this.getOwnerComponent().getModel();
            this._pPdfLibraryLoad = null;
            this._mEntities = {
                clients: {
                    entitySet: "/ZI_YEG_CLIENT",
                    collection: "clients",
                    tableId: "clientTable",
                    singular: "Client",
                    title: "Clients",
                    keyFields: ["Id"],
                    fields: [
                        { name: "Id", label: "Id", readOnly: true },
                        { name: "Prenom", label: "Prenom", required: true, maxLength: 40 },
                        { name: "Nom", label: "Nom", required: true, maxLength: 40 },
                        { name: "Datenaissance", label: "Date de naissance", type: "date" }
                    ]
                },
                employes: {
                    entitySet: "/ZI_YEG_EMPLOYE",
                    collection: "employes",
                    tableId: "employeTable",
                    singular: "Employe",
                    title: "Employes",
                    keyFields: ["Id"],
                    fields: [
                        { name: "Id", label: "Id", readOnly: true },
                        { name: "Prenom", label: "Prenom", required: true, maxLength: 40 },
                        { name: "Nom", label: "Nom", required: true, maxLength: 40 },
                        { name: "Datenaissance", label: "Date de naissance", type: "date" }
                    ]
                },
                factures: {
                    entitySet: "/ZI_YEG_FACTURE",
                    collection: "factures",
                    tableId: "factureTable",
                    singular: "Facture",
                    title: "Factures",
                    keyFields: ["Id", "Clientid", "Clientfullname"],
                    fields: [
                        { name: "Id", label: "Id", readOnly: true },
                        { name: "Clientid", label: "Client ID", required: true, maxLength: 36 },
                        { name: "Clientfullname", label: "Nom complet", required: true, maxLength: 100 },
                        { name: "Voitureid", label: "Voiture ID", maxLength: 200 },
                        { name: "Amount", label: "Montant", type: "decimal", scale: 2, required: true },
                        { name: "Devise", label: "Devise", required: true, maxLength: 5 },
                        { name: "Createdby", label: "Cree par", readOnly: true },
                        { name: "Createdat", label: "Cree le", readOnly: true, type: "datetime" },
                        { name: "Counter", label: "Compteur", readOnly: true, type: "number" }
                    ]
                },
                voitures: {
                    entitySet: "/ZI_YEG_VOITURE",
                    collection: "voitures",
                    tableId: "voitureTable",
                    singular: "Voiture",
                    title: "Voitures",
                    keyFields: ["Id", "Matricule"],
                    fields: [
                        { name: "Id", label: "Id", readOnly: true },
                        { name: "Matricule", label: "Matricule", required: true, maxLength: 20 },
                        { name: "Marque", label: "Marque", maxLength: 20 }
                    ]
                }
            };

            this._aEntityKeys = Object.keys(this._mEntities);

            var oUiModel = new JSONModel({
                busy: false,
                message: "",
                messageType: "Information",
                counts: {
                    clients: 0,
                    employes: 0,
                    factures: 0,
                    voitures: 0
                },
                clients: [],
                employes: [],
                factures: [],
                facturesFiltered: [],
                voitures: [],
                factureFilters: this._getEmptyFactureFilters(),
                factureEdit: {
                    original: null,
                    data: {},
                    clients: [],
                    voitures: []
                },
                factureCreate: {
                    data: {
                        Clientid: "",
                        Clientfullname: "",
                        Voitureid: "",
                        Amount: "",
                        Devise: "EUR"
                    },
                    clients: [],
                    voitures: []
                }
            });

            oUiModel.setDefaultBindingMode("TwoWay");
            this.getView().setModel(oUiModel, "ui");

            this.byId("page").addStyleClass("zyegMainPage");
            this._applyStyleClasses();

            this.getOwnerComponent().getRouter().getRoute("RouteMain").attachPatternMatched(this._onRouteMatched, this);

            this.getOwnerComponent().getModel().metadataLoaded().then(function () {
                this._loadAllData(true);
            }.bind(this));
        },

        _onRouteMatched: function (oEvent) {
            var oArgs = oEvent.getParameter("arguments") || {};
            var oQuery = oArgs["?query"] || {};

            if (oQuery.refresh === "X") {
                this._loadEntity("factures", true);
            }
        },

        _getEmptyFactureFilters: function () {
            return {
                Id: "",
                Clientid: "",
                Clientfullname: "",
                Voitureid: "",
                Amount: "",
                Devise: "",
                Createdby: "",
                Createdat: "",
                Counter: ""
            };
        },

        _applyStyleClasses: function () {
            [
                ["shell", "zyegShell"],
                ["hero", "zyegHero"],
                ["heroBar", "zyegHeroBar"],
                ["heroCopy", "zyegHeroCopy"],
                ["eyebrow", "zyegEyebrow"],
                ["heroTitle", "zyegHeroTitle"],
                ["heroText", "zyegHeroText"],
                ["refreshAllButton", "zyegHeroButton"],
                ["kpiGrid", "zyegKpiGrid"],
                ["clientsKpiCard", "zyegKpiCard"],
                ["employesKpiCard", "zyegKpiCard"],
                ["facturesKpiCard", "zyegKpiCard"],
                ["voituresKpiCard", "zyegKpiCard"],
                ["clientsKpiLabel", "zyegKpiLabel"],
                ["employesKpiLabel", "zyegKpiLabel"],
                ["facturesKpiLabel", "zyegKpiLabel"],
                ["voituresKpiLabel", "zyegKpiLabel"],
                ["clientsKpiValue", "zyegKpiValue"],
                ["employesKpiValue", "zyegKpiValue"],
                ["facturesKpiValue", "zyegKpiValue"],
                ["voituresKpiValue", "zyegKpiValue"],
                ["messageStrip", "zyegMessageStrip"],
                ["entityTabs", "zyegTabs"],
                ["clientsSection", "zyegSection"],
                ["employesSection", "zyegSection"],
                ["facturesSection", "zyegSection"],
                ["voituresSection", "zyegSection"],
                ["clientsToolbar", "zyegSectionToolbar"],
                ["employesToolbar", "zyegSectionToolbar"],
                ["facturesToolbar", "zyegSectionToolbar"],
                ["voituresToolbar", "zyegSectionToolbar"],
                ["factureFiltersBox", "zyegFiltersBox"],
                ["factureFiltersRow1", "zyegFiltersRow"],
                ["factureFiltersRow2", "zyegFiltersRow"]
            ].forEach(function (aStyle) {
                var oControl = this.byId(aStyle[0]);

                if (oControl) {
                    oControl.addStyleClass(aStyle[1]);
                }
            }.bind(this));
        },

        onRefreshAll: function () {
            this._loadAllData(false);
        },

        onRefreshPress: function (oEvent) {
            var sEntityKey = this._getEntityKey(oEvent);

            if (sEntityKey) {
                this._loadEntity(sEntityKey, false);
            }
        },

        onCreatePress: function (oEvent) {
            var sEntityKey = this._getEntityKey(oEvent);

            if (sEntityKey === "factures") {
                this.onFactureCreatePress();
                return;
            }

            if (sEntityKey) {
                this._openEditor(sEntityKey, false);
            }
        },

        onEditPress: function (oEvent) {
            var sEntityKey = this._getEntityKey(oEvent);

            if (sEntityKey) {
                this._openEditorFromSelection(sEntityKey);
            }
        },

        onDeletePress: function (oEvent) {
            var sEntityKey = this._getEntityKey(oEvent);

            if (sEntityKey) {
                this._deleteSelected(sEntityKey);
            }
        },

        onTableUpdateFinished: function () {
            // Keep KPI values from loaded collections, not filtered rows.
        },

        onFactureCreateNav: function () {
            this.getOwnerComponent().getRouter().navTo("RouteFactureCreate");
        },

        onFactureCreatePress: function () {
            var oUiModel = this._getUiModel();

            oUiModel.setProperty("/factureCreate", {
                data: {
                    Clientid: "",
                    Clientfullname: "",
                    Voitureid: "",
                    Amount: "",
                    Devise: "EUR"
                },
                clients: oUiModel.getProperty("/clients") || [],
                voitures: [{ Id: "", Matricule: "Aucune", Marque: "" }].concat(oUiModel.getProperty("/voitures") || [])
            });

            if (!this._pFactureCreateDialog) {
                this._pFactureCreateDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "zyeg.view.fragments.FactureCreate",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pFactureCreateDialog.then(function (oDialog) {
                var oDialogBody = Fragment.byId(this.getView().getId(), "factureCreateContent");

                if (oDialogBody) {
                    oDialogBody.addStyleClass("zyegDialogBody");
                }

                oDialog.addStyleClass("zyegFormDialog");
                oDialog.open();
            }.bind(this));
        },

        onFactureFilterChange: function () {
            this._applyFactureFilters();
        },

        onClearFactureFilters: function () {
            var oUiModel = this._getUiModel();

            oUiModel.setProperty("/factureFilters", this._getEmptyFactureFilters());
            this._applyFactureFilters();
        },

        onFactureDetailsPress: function (oEvent) {
            var oFacture = this._getRowDataFromEvent(oEvent);
            var oUiModel = this._getUiModel();
            var aClients = oUiModel.getProperty("/clients") || [];
            var aVoitures = oUiModel.getProperty("/voitures") || [];
            var oClient = aClients.find(function (oRow) {
                return String(oRow.Id) === String(oFacture.Clientid);
            });
            var oVoiture = aVoitures.find(function (oRow) {
                return String(oRow.Id) === String(oFacture.Voitureid);
            });
            var sClientDetails = oClient ? (oClient.Prenom || "") + " " + (oClient.Nom || "") + "\nDate naissance: " + formatter.formatDate(oClient.Datenaissance) : "Client introuvable";
            var sVoitureDetails = oVoiture ? "Marque: " + (oVoiture.Marque || "") + "\nMatricule: " + (oVoiture.Matricule || "") : "Voiture introuvable";
            var sText = [
                "Facture",
                "ID: " + (oFacture.Id || ""),
                "Client ID: " + (oFacture.Clientid || ""),
                "Nom client: " + (oFacture.Clientfullname || ""),
                "Voiture ID: " + (oFacture.Voitureid || ""),
                "Montant: " + formatter.formatAmount(oFacture.Amount),
                "Devise: " + (oFacture.Devise || ""),
                "",
                "Details client",
                sClientDetails,
                "",
                "Details voiture",
                sVoitureDetails
            ].join("\n");

            MessageBox.information(sText, {
                title: "Details facture"
            });
        },

        onFactureUpdatePress: function (oEvent) {
            var oFacture = this._getRowDataFromEvent(oEvent);

            this._openFactureEditDialog(oFacture);
        },

        onFactureDeletePress: function (oEvent) {
            var oFacture = this._getRowDataFromEvent(oEvent);
            var sPath = this._buildEntityPath("factures", oFacture);

            MessageBox.confirm("Supprimer cette facture ?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) {
                        return;
                    }

                    this._setBusy(true);
                    this._oODataModel.remove(sPath, {
                        success: function () {
                            this._loadEntity("factures", true).then(function () {
                                this._setBusy(false);
                                MessageToast.show("Facture supprimee.");
                            }.bind(this));
                        }.bind(this),
                        error: function () {
                            this._setBusy(false);
                            this._setMessage("La suppression a echoue.", "Error");
                        }.bind(this)
                    });
                }.bind(this)
            });
        },

        onFacturePdfPress: function (oEvent) {
            var oFacture = this._getRowDataFromEvent(oEvent);

            if (!oFacture) {
                MessageToast.show("Aucune facture a exporter.");
                return;
            }

            this._downloadFacturePdf(oFacture);
        },

        onExportFactures: function () {
            var aRows = this._getUiModel().getProperty("/facturesFiltered") || [];

            if (!aRows.length) {
                MessageToast.show("Aucune facture a exporter.");
                return;
            }

            var oSheet = new Spreadsheet({
                workbook: {
                    columns: [
                        { label: "Id", property: "Id" },
                        { label: "Client ID", property: "Clientid" },
                        { label: "Nom client", property: "Clientfullname" },
                        { label: "Voiture ID", property: "Voitureid" },
                        { label: "Montant", property: "Amount", type: "number" },
                        { label: "Devise", property: "Devise" },
                        { label: "Cree par", property: "Createdby" },
                        { label: "Cree le", property: "Createdat" },
                        { label: "Compteur", property: "Counter", type: "number" }
                    ]
                },
                dataSource: aRows,
                fileName: "factures.xlsx"
            });

            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        },

        onExportFacturesPdf: function () {
            var aRows = this._getUiModel().getProperty("/factures") || [];

            if (!aRows.length) {
                MessageToast.show("Aucune facture a exporter.");
                return;
            }

            this._downloadFacturesPdf(aRows);
        },

        _openFactureEditDialog: function (oFacture) {
            var oUiModel = this._getUiModel();
            var oEditData = {
                original: oFacture,
                data: {
                    Clientid: oFacture.Clientid || "",
                    Clientfullname: oFacture.Clientfullname || "",
                    Voitureid: oFacture.Voitureid || "",
                    Amount: oFacture.Amount === undefined || oFacture.Amount === null ? "" : String(oFacture.Amount),
                    Devise: oFacture.Devise || ""
                },
                clients: oUiModel.getProperty("/clients") || [],
                voitures: [{ Id: "", Matricule: "Aucune", Marque: "" }].concat(oUiModel.getProperty("/voitures") || [])
            };

            oUiModel.setProperty("/factureEdit", oEditData);

            if (!this._pFactureEditDialog) {
                this._pFactureEditDialog = Fragment.load({
                    id: this.getView().getId(),
                    name: "zyeg.view.fragments.FactureEdit",
                    controller: this
                }).then(function (oDialog) {
                    this.getView().addDependent(oDialog);
                    return oDialog;
                }.bind(this));
            }

            this._pFactureEditDialog.then(function (oDialog) {
                var oDialogBody = Fragment.byId(this.getView().getId(), "factureEditContent");

                if (oDialogBody) {
                    oDialogBody.addStyleClass("zyegDialogBody");
                }

                oDialog.addStyleClass("zyegFormDialog");
                oDialog.open();
            }.bind(this));
        },

        onFactureEditClientChange: function (oEvent) {
            var sClientId = oEvent.getSource().getSelectedKey();
            var oUiModel = this._getUiModel();
            var aClients = oUiModel.getProperty("/factureEdit/clients") || [];
            var oClient = aClients.find(function (oRow) {
                return String(oRow.Id) === String(sClientId);
            });

            oUiModel.setProperty("/factureEdit/data/Clientid", sClientId);
            oUiModel.setProperty("/factureEdit/data/Clientfullname", oClient ? ((oClient.Prenom || "") + " " + (oClient.Nom || "")).trim() : "");

            var oClientSelect = Fragment.byId(this.getView().getId(), "factureEditClientSelect");

            if (oClientSelect) {
                oClientSelect.setValueState(ValueState.None);
                oClientSelect.setValueStateText("");
            }
        },

        onFactureCreateClientChange: function (oEvent) {
            var sClientId = oEvent.getSource().getSelectedKey();
            var oUiModel = this._getUiModel();
            var aClients = oUiModel.getProperty("/factureCreate/clients") || [];
            var oClient = aClients.find(function (oRow) {
                return String(oRow.Id) === String(sClientId);
            });

            oUiModel.setProperty("/factureCreate/data/Clientid", sClientId);
            oUiModel.setProperty("/factureCreate/data/Clientfullname", oClient ? ((oClient.Prenom || "") + " " + (oClient.Nom || "")).trim() : "");

            oEvent.getSource().setValueState(ValueState.None);
            oEvent.getSource().setValueStateText("");
        },

        onFactureCreateFieldLiveChange: function (oEvent) {
            var oControl = oEvent.getSource();

            if (oControl) {
                oControl.setValueState(ValueState.None);
                oControl.setValueStateText("");
            }
        },

        onFactureCreateSave: function () {
            var oUiModel = this._getUiModel();
            var oData = oUiModel.getProperty("/factureCreate/data") || {};
            var sAmount = this._toODataDecimal(oData.Amount, 2);
            var oPayload = {
                Clientid: oData.Clientid,
                Clientfullname: (oData.Clientfullname || "").trim(),
                Voitureid: oData.Voitureid || "",
                Amount: sAmount,
                Devise: (oData.Devise || "").trim().toUpperCase()
            };
            var oValidation = this._validateFacturePayload(oPayload, true);

            oUiModel.setProperty("/factureCreate/data/Devise", oPayload.Devise);

            this._clearFactureCreateValueStates();

            if (oValidation.messages.length) {
                this._applyFactureCreateValidationStates(oValidation.fields);
                MessageBox.error(oValidation.messages.join("\n"));
                return;
            }

            this._setBusy(true);
            this._oODataModel.create("/ZI_YEG_FACTURE", oPayload, {
                success: function () {
                    this._closeFactureCreate();
                    this._loadEntity("factures", true).then(function () {
                        this._setBusy(false);
                        MessageToast.show("Facture creee.");
                    }.bind(this)).catch(function () {
                        this._setBusy(false);
                        this._setMessage("Facture creee, mais rafraichissement impossible.", "Warning");
                    }.bind(this));
                }.bind(this),
                error: function (oError) {
                    this._setBusy(false);
                    MessageBox.error(this._extractODataErrorMessage(oError, "La creation de la facture a echoue."));
                }.bind(this)
            });
        },

        onFactureCreateCancel: function () {
            this._closeFactureCreate();
        },

        onFactureEditSave: function () {
            var oUiModel = this._getUiModel();
            var oData = oUiModel.getProperty("/factureEdit/data");
            var oOriginal = oUiModel.getProperty("/factureEdit/original");
            var sAmount = this._toODataDecimal(oData.Amount, 2);
            var oPayload = {
                Clientid: oData.Clientid,
                Clientfullname: oData.Clientfullname,
                Voitureid: oData.Voitureid || "",
                Amount: sAmount,
                Devise: (oData.Devise || "").trim().toUpperCase()
            };
            var oValidation = this._validateFacturePayload(oPayload, false);

            oUiModel.setProperty("/factureEdit/data/Devise", oPayload.Devise);

            this._clearFactureEditValueStates();

            if (oValidation.messages.length) {
                this._applyFactureEditValidationStates(oValidation.fields);
                MessageBox.error(oValidation.messages.join("\n"));
                return;
            }

            this._setBusy(true);
            this._oODataModel.update(this._buildEntityPath("factures", oOriginal), oPayload, {
                merge: true,
                success: function () {
                    this._closeFactureEdit();
                    this._loadEntity("factures", true).then(function () {
                        this._setBusy(false);
                        MessageToast.show("Facture modifiee.");
                    }.bind(this)).catch(function () {
                        this._setBusy(false);
                        this._setMessage("Facture modifiee, mais rafraichissement impossible.", "Warning");
                    }.bind(this));
                }.bind(this),
                error: function (oError) {
                    this._setBusy(false);
                    MessageBox.error(this._extractODataErrorMessage(oError, "La modification de la facture a echoue."));
                }.bind(this)
            });
        },

        onFactureEditCancel: function () {
            this._closeFactureEdit();
        },

        onFactureEditFieldLiveChange: function (oEvent) {
            var oControl = oEvent.getSource();

            if (oControl) {
                oControl.setValueState(ValueState.None);
                oControl.setValueStateText("");
            }
        },

        _closeFactureEdit: function () {
            if (!this._pFactureEditDialog) {
                return;
            }

            this._pFactureEditDialog.then(function (oDialog) {
                this._safeCloseDialog(oDialog);
            }.bind(this));
        },

        _validateFacturePayload: function (oPayload, bCreateMode) {
            var aErrors = [];
            var oFieldErrors = {};
            var fAmount = Number(oPayload.Amount);

            if (!oPayload.Clientid) {
                aErrors.push("Le client est obligatoire.");
                oFieldErrors.Clientid = "Le client est obligatoire.";
            }

            if (!oPayload.Clientfullname) {
                aErrors.push("Le nom complet du client est obligatoire.");
            }

            if (oPayload.Amount === "" || oPayload.Amount === null || Number.isNaN(fAmount)) {
                aErrors.push("Le montant doit etre numerique.");
                oFieldErrors.Amount = "Le montant doit etre numerique.";
            } else if (fAmount <= 0) {
                aErrors.push("Le montant doit etre superieur a 0.");
                oFieldErrors.Amount = "Le montant doit etre superieur a 0.";
            }

            if (!oPayload.Devise) {
                aErrors.push("La devise est obligatoire.");
                oFieldErrors.Devise = "La devise est obligatoire.";
            }

            if (oPayload.Devise && oPayload.Devise.length > 5) {
                aErrors.push("La devise ne doit pas depasser 5 caracteres.");
                oFieldErrors.Devise = "La devise ne doit pas depasser 5 caracteres.";
            }

            if (bCreateMode && !oPayload.Clientid) {
                aErrors.push("Creation impossible sans selection de client.");
            }

            return {
                messages: aErrors,
                fields: oFieldErrors
            };
        },

        _clearFactureEditValueStates: function () {
            ["factureEditClientSelect", "factureEditAmountInput", "factureEditDeviseInput"].forEach(function (sId) {
                var oControl = Fragment.byId(this.getView().getId(), sId);

                if (oControl) {
                    oControl.setValueState(ValueState.None);
                    oControl.setValueStateText("");
                }
            }.bind(this));
        },

        _applyFactureEditValidationStates: function (oFieldErrors) {
            var mMap = {
                Clientid: "factureEditClientSelect",
                Amount: "factureEditAmountInput",
                Devise: "factureEditDeviseInput"
            };

            Object.keys(oFieldErrors || {}).forEach(function (sField) {
                var oControl = Fragment.byId(this.getView().getId(), mMap[sField]);

                if (oControl) {
                    oControl.setValueState(ValueState.Error);
                    oControl.setValueStateText(oFieldErrors[sField]);
                }
            }.bind(this));
        },

        _clearFactureCreateValueStates: function () {
            ["factureCreateClientSelect", "factureCreateAmountInput", "factureCreateDeviseInput"].forEach(function (sId) {
                var oControl = Fragment.byId(this.getView().getId(), sId);

                if (oControl) {
                    oControl.setValueState(ValueState.None);
                    oControl.setValueStateText("");
                }
            }.bind(this));
        },

        _applyFactureCreateValidationStates: function (oFieldErrors) {
            var mMap = {
                Clientid: "factureCreateClientSelect",
                Amount: "factureCreateAmountInput",
                Devise: "factureCreateDeviseInput"
            };

            Object.keys(oFieldErrors || {}).forEach(function (sField) {
                var oControl = Fragment.byId(this.getView().getId(), mMap[sField]);

                if (oControl) {
                    oControl.setValueState(ValueState.Error);
                    oControl.setValueStateText(oFieldErrors[sField]);
                }
            }.bind(this));
        },

        _closeFactureCreate: function () {
            if (!this._pFactureCreateDialog) {
                return;
            }

            this._pFactureCreateDialog.then(function (oDialog) {
                this._safeCloseDialog(oDialog);
            }.bind(this));
        },

        _getRowDataFromEvent: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("ui");

            return oContext ? oContext.getObject() : {};
        },

        _getEntityKey: function (oEvent) {
            return oEvent.getSource().data("entity");
        },

        _getUiModel: function () {
            return this.getView().getModel("ui");
        },

        _setMessage: function (sMessage, sMessageType) {
            var oUiModel = this._getUiModel();

            oUiModel.setProperty("/message", sMessage || "");
            oUiModel.setProperty("/messageType", sMessageType || "Information");
        },

        _setBusy: function (bBusy) {
            this._getUiModel().setProperty("/busy", bBusy);
        },

        _safeCloseDialog: function (oDialog) {
            if (!oDialog || oDialog.bIsDestroyed) {
                return;
            }

            try {
                if (oDialog.isOpen && oDialog.isOpen()) {
                    oDialog.close();
                }
            } catch (oError) {
                // Ignore close errors if the dialog has already been torn down.
            }
        },

        _loadAllData: function (bSilent) {
            this._setBusy(true);

            Promise.allSettled(this._aEntityKeys.map(function (sEntityKey) {
                return this._loadEntity(sEntityKey, true);
            }.bind(this))).then(function (aResults) {
                var oFailure = aResults.find(function (oResult) {
                    return oResult.status === "rejected";
                });

                this._setBusy(false);

                if (oFailure && !bSilent) {
                    this._setMessage("Certaines donnees n'ont pas pu etre chargees.", "Error");
                    return;
                }

                if (!bSilent) {
                    this._setMessage("Donnees actualisees.", "Success");
                    MessageToast.show("Les donnees ont ete actualisees.");
                } else {
                    this._setMessage("", "Information");
                }
            }.bind(this));
        },

        _loadEntity: function (sEntityKey, bSilent) {
            var oEntity = this._mEntities[sEntityKey];
            var oUiModel = this._getUiModel();

            return new Promise(function (resolve, reject) {
                this._oODataModel.read(oEntity.entitySet, {
                    urlParameters: {
                        "$top": 1000
                    },
                    success: function (oData) {
                        var aRows = (oData && oData.results) ? oData.results.map(this._normalizeRow.bind(this)) : [];

                        oUiModel.setProperty("/" + oEntity.collection, aRows);
                        oUiModel.setProperty("/counts/" + sEntityKey, aRows.length);

                        if (sEntityKey === "factures") {
                            this._applyFactureFilters();
                        }

                        if (!bSilent) {
                            this._setMessage(oEntity.title + " chargees.", "Success");
                        }

                        resolve(aRows);
                    }.bind(this),
                    error: function (oError) {
                        if (!bSilent) {
                            this._setMessage("Impossible de charger " + oEntity.title.toLowerCase() + ".", "Error");
                        }

                        reject(oError);
                    }.bind(this)
                });
            }.bind(this));
        },

        _applyFactureFilters: function () {
            var oUiModel = this._getUiModel();
            var aSource = oUiModel.getProperty("/factures") || [];
            var oFilters = oUiModel.getProperty("/factureFilters") || this._getEmptyFactureFilters();
            var aFiltered = aSource.filter(function (oRow) {
                return this._matchesFactureFilters(oRow, oFilters);
            }.bind(this));

            oUiModel.setProperty("/facturesFiltered", aFiltered);
        },

        _matchesFactureFilters: function (oRow, oFilters) {
            var bMatchDate = true;
            var sDateFilter = (oFilters.Createdat || "").trim();

            if (sDateFilter) {
                bMatchDate = this._toDateInputValue(oRow.Createdat) === sDateFilter;
            }

            return this._contains(oRow.Id, oFilters.Id) &&
                this._contains(oRow.Clientid, oFilters.Clientid) &&
                this._contains(oRow.Clientfullname, oFilters.Clientfullname) &&
                this._contains(oRow.Voitureid, oFilters.Voitureid) &&
                this._contains(oRow.Amount, oFilters.Amount) &&
                this._contains(oRow.Devise, oFilters.Devise) &&
                this._contains(oRow.Createdby, oFilters.Createdby) &&
                bMatchDate &&
                this._contains(oRow.Counter, oFilters.Counter);
        },

        _contains: function (vData, vFilter) {
            var sFilter = (vFilter === undefined || vFilter === null) ? "" : String(vFilter).toLowerCase().trim();

            if (!sFilter) {
                return true;
            }

            var sData = (vData === undefined || vData === null) ? "" : String(vData).toLowerCase();

            return sData.indexOf(sFilter) !== -1;
        },

        _normalizeRow: function (oRow) {
            var oResult = {};

            Object.keys(oRow || {}).forEach(function (sKey) {
                var vValue = oRow[sKey];

                if (vValue instanceof Date) {
                    oResult[sKey] = vValue.toISOString().slice(0, 10);
                    return;
                }

                if (typeof vValue === "string") {
                    var aMatch = /\/Date\((\d+)\)\//.exec(vValue);

                    if (aMatch) {
                        oResult[sKey] = new Date(Number(aMatch[1])).toISOString().slice(0, 10);
                        return;
                    }
                }

                oResult[sKey] = vValue;
            });

            return oResult;
        },

        _openEditorFromSelection: function (sEntityKey) {
            var oTable = this.byId(this._mEntities[sEntityKey].tableId);
            var oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                MessageToast.show("Selectionnez une ligne d'abord.");
                return;
            }

            var oContext = oSelectedItem.getBindingContext("ui");

            this._openEditor(sEntityKey, true, oContext ? oContext.getObject() : null);
        },

        _deleteSelected: function (sEntityKey) {
            var oTable = this.byId(this._mEntities[sEntityKey].tableId);
            var oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                MessageToast.show("Selectionnez une ligne d'abord.");
                return;
            }

            var oContext = oSelectedItem.getBindingContext("ui");
            var oSelectedData = oContext ? oContext.getObject() : null;
            var sPath = this._buildEntityPath(sEntityKey, oSelectedData);

            MessageBox.confirm("Supprimer cette " + this._mEntities[sEntityKey].singular.toLowerCase() + " ?", {
                actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                emphasizedAction: MessageBox.Action.OK,
                onClose: function (sAction) {
                    if (sAction !== MessageBox.Action.OK) {
                        return;
                    }

                    this._setBusy(true);

                    this._oODataModel.remove(sPath, {
                        success: function () {
                            this._loadEntity(sEntityKey, true).then(function () {
                                this._setBusy(false);
                                this._setMessage(this._mEntities[sEntityKey].singular + " supprimee.", "Success");
                                MessageToast.show(this._mEntities[sEntityKey].singular + " supprimee.");
                            }.bind(this));
                        }.bind(this),
                        error: function () {
                            this._setBusy(false);
                            this._setMessage("La suppression a echoue.", "Error");
                        }.bind(this)
                    });
                }.bind(this)
            });
        },

        _openEditor: function (sEntityKey, bEditMode, oInitialData) {
            var oEntity = this._mEntities[sEntityKey];
            var oEditorData = this._prepareEditorData(oEntity, bEditMode, oInitialData || {});
            var oEditorModel = new JSONModel(oEditorData);

            oEditorModel.setDefaultBindingMode("TwoWay");

            var aFieldRows = oEntity.fields.map(function (oField) {
                return this._createFieldRow(oField);
            }.bind(this));
            var oDialogBody = new VBox({
                width: "100%",
                items: aFieldRows
            });

            oDialogBody.addStyleClass("zyegDialogBody");

            var oDialog = new Dialog({
                title: (bEditMode ? "Modifier " : "Creer ") + oEntity.singular,
                contentWidth: "34rem",
                resizable: true,
                draggable: true,
                stretchOnPhone: true,
                content: [oDialogBody],
                beginButton: new Button({
                    text: "Enregistrer",
                    type: "Emphasized",
                    press: function () {
                        this._saveEntity(sEntityKey, bEditMode, oEditorModel, oDialog);
                    }.bind(this)
                }),
                endButton: new Button({
                    text: "Annuler",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addStyleClass("zyegFormDialog");
            oDialog.setModel(oEditorModel, "editor");
            this.getView().addDependent(oDialog);
            oDialog.open();
        },

        _prepareEditorData: function (oEntity, bEditMode, oSourceData) {
            var oEditorData = {};

            oEntity.fields.forEach(function (oField) {
                var vValue = oSourceData[oField.name];

                if (oField.type === "date") {
                    oEditorData[oField.name] = this._toDateInputValue(vValue);
                    return;
                }

                if (oField.type === "number" || oField.type === "decimal") {
                    oEditorData[oField.name] = vValue === null || vValue === undefined ? "" : String(vValue);
                    return;
                }

                if (vValue === undefined || vValue === null) {
                    oEditorData[oField.name] = "";
                    return;
                }

                oEditorData[oField.name] = String(vValue);
            }.bind(this));

            if (!bEditMode) {
                delete oEditorData.Id;
                delete oEditorData.Createdby;
                delete oEditorData.Createdat;
                delete oEditorData.Counter;
            }

            return oEditorData;
        },

        _createFieldRow: function (oField) {
            var bEditable = !oField.readOnly;
            var oControl;

            if (oField.type === "date" && bEditable) {
                oControl = new DatePicker({
                    width: "100%",
                    value: {
                        path: "editor>/" + oField.name
                    },
                    valueFormat: "yyyy-MM-dd",
                    displayFormat: "medium"
                });
            } else if ((oField.type === "number" || oField.type === "decimal") && bEditable) {
                oControl = new Input({
                    width: "100%",
                    type: "Text",
                    valueLiveUpdate: true,
                    value: {
                        path: "editor>/" + oField.name
                    }
                });
            } else if (bEditable) {
                oControl = new Input({
                    width: "100%",
                    maxLength: oField.maxLength,
                    valueLiveUpdate: true,
                    value: {
                        path: "editor>/" + oField.name
                    }
                });
            } else {
                oControl = new Text({
                    text: {
                        path: "editor>/" + oField.name,
                        formatter: formatter.formatText
                    }
                });
            }

            var oRow = new VBox({
                items: [
                    new Label({
                        text: oField.label,
                        required: !!oField.required && bEditable
                    }),
                    oControl
                ]
            });

            oRow.addStyleClass("zyegFieldRow");

            return oRow;
        },

        _saveEntity: function (sEntityKey, bEditMode, oEditorModel, oDialog) {
            var oEntity = this._mEntities[sEntityKey];
            var oPayload = this._buildPayload(oEntity, bEditMode, oEditorModel.getData());
            var sPath = bEditMode ? this._buildEntityPath(sEntityKey, this._findSelectedData(sEntityKey)) : oEntity.entitySet;

            if (!sPath) {
                MessageToast.show("Selectionnez une ligne d'abord.");
                return;
            }

            this._setBusy(true);

            var fnSuccess = function () {
                this._safeCloseDialog(oDialog);
                this._loadEntity(sEntityKey, true).then(function () {
                    this._setBusy(false);
                    this._setMessage(oEntity.singular + " enregistree.", "Success");
                    MessageToast.show(oEntity.singular + " enregistree.");
                }.bind(this)).catch(function () {
                    this._setBusy(false);
                    this._setMessage("Enregistrement effectue, mais rafraichissement impossible.", "Warning");
                }.bind(this));
            }.bind(this);

            var fnError = function (oError) {
                this._setBusy(false);
                this._setMessage(this._extractODataErrorMessage(oError, "L'enregistrement a echoue."), "Error");
            }.bind(this);

            if (bEditMode) {
                this._oODataModel.update(sPath, oPayload, {
                    merge: true,
                    success: fnSuccess,
                    error: fnError
                });
                return;
            }

            this._oODataModel.create(sPath, oPayload, {
                success: fnSuccess,
                error: fnError
            });
        },

        _buildPayload: function (oEntity, bEditMode, oData) {
            var oPayload = {};

            oEntity.fields.forEach(function (oField) {
                var vRawValue = oData[oField.name];

                if (oField.readOnly && !bEditMode) {
                    return;
                }

                if (oField.readOnly && bEditMode) {
                    if (vRawValue !== undefined && vRawValue !== null && vRawValue !== "") {
                        oPayload[oField.name] = this._convertFieldValue(oField, vRawValue);
                    }

                    return;
                }

                if (vRawValue === undefined || vRawValue === null || vRawValue === "") {
                    return;
                }

                oPayload[oField.name] = this._convertFieldValue(oField, vRawValue);
            }.bind(this));

            if (!bEditMode) {
                delete oPayload.Id;
            }

            return oPayload;
        },

        _convertFieldValue: function (oField, vValue) {
            if (oField.type === "date") {
                return this._toDateObject(vValue);
            }

            if (oField.type === "number") {
                var fNumber = Number(vValue);

                return Number.isNaN(fNumber) ? vValue : fNumber;
            }

            if (oField.type === "decimal") {
                return this._toODataDecimal(vValue, oField.scale || 2);
            }

            return vValue;
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

        _toDateInputValue: function (vValue) {
            if (!vValue) {
                return "";
            }

            if (vValue instanceof Date) {
                return vValue.toISOString().slice(0, 10);
            }

            if (typeof vValue === "string") {
                var oDate = this._parseDate(vValue);

                return oDate ? oDate.toISOString().slice(0, 10) : vValue;
            }

            return "";
        },

        _toDateObject: function (vValue) {
            if (vValue instanceof Date) {
                return vValue;
            }

            if (typeof vValue === "string") {
                return this._parseDate(vValue);
            }

            return null;
        },

        _parseDate: function (sValue) {
            if (!sValue) {
                return null;
            }

            var aParts = sValue.split("-");

            if (aParts.length === 3) {
                var iYear = Number(aParts[0]);
                var iMonth = Number(aParts[1]) - 1;
                var iDay = Number(aParts[2]);
                var oDate = new Date(iYear, iMonth, iDay);

                if (!Number.isNaN(oDate.getTime())) {
                    return oDate;
                }
            }

            var oParsed = new Date(sValue);

            return Number.isNaN(oParsed.getTime()) ? null : oParsed;
        },

        _extractODataErrorMessage: function (oError, sFallbackMessage) {
            var sFallback = sFallbackMessage || "Une erreur est survenue.";

            if (!oError) {
                return sFallback;
            }

            if (oError.message) {
                return oError.message;
            }

            try {
                var oResponse = JSON.parse(oError.responseText || "{}");
                var sMessage = oResponse && oResponse.error && oResponse.error.message && oResponse.error.message.value;

                return sMessage || sFallback;
            } catch (oParseError) {
                return sFallback;
            }
        },

        _findSelectedData: function (sEntityKey) {
            var oTable = this.byId(this._mEntities[sEntityKey].tableId);
            var oSelectedItem = oTable.getSelectedItem();

            if (!oSelectedItem) {
                return null;
            }

            var oContext = oSelectedItem.getBindingContext("ui");

            return oContext ? oContext.getObject() : null;
        },

        _buildEntityPath: function (sEntityKey, oData) {
            var oEntity = this._mEntities[sEntityKey];

            if (!oData) {
                return "";
            }

            var oKeyData = {};

            oEntity.keyFields.forEach(function (sKeyField) {
                oKeyData[sKeyField] = oData[sKeyField];
            });

            return "/" + this._oODataModel.createKey(oEntity.entitySet.slice(1), oKeyData);
        },

        _downloadFacturePdf: function (oFacture) {
            this._downloadFacturesPdf(oFacture ? [oFacture] : []);
        },

        _downloadFacturesPdf: function (aFactures) {
            var aRows = Array.isArray(aFactures) ? aFactures : [];

            if (!aRows.length) {
                MessageToast.show("Aucune facture a exporter.");
                return;
            }

            this._ensurePdfLibraryLoaded().then(function () {
                var oDoc = this._createPdfDocument();

                if (!oDoc) {
                    MessageToast.show("La bibliotheque PDF n'est pas disponible.");
                    return;
                }

                if (aRows.length === 1) {
                    this._buildSingleFacturePdf(oDoc, aRows[0]);
                    oDoc.save(this._buildFacturePdfFileName(aRows[0]));
                    return;
                }

                this._buildFacturesPdf(oDoc, aRows);
                oDoc.save(this._buildFacturesPdfFileName(aRows));
            }.bind(this)).catch(function () {
                MessageToast.show("La bibliotheque PDF n'est pas disponible.");
            });
        },

        _ensurePdfLibraryLoaded: function () {
            if (window.jspdf && window.jspdf.jsPDF && window.jspdf.jsPDF.API && window.jspdf.jsPDF.API.autoTable) {
                return Promise.resolve();
            }

            if (this._pPdfLibraryLoad) {
                return this._pPdfLibraryLoad;
            }

            var sJsPdfUrl = sap.ui.require.toUrl("zyeg/thirdparty/jspdf/jspdf.umd.min.js");
            var sAutoTableUrl = sap.ui.require.toUrl("zyeg/thirdparty/jspdf-autotable/jspdf.plugin.autotable.min.js");

            this._pPdfLibraryLoad = this._loadScriptOnce(sJsPdfUrl)
                .then(function () {
                    return this._loadScriptOnce(sAutoTableUrl);
                }.bind(this))
                .then(function () {
                    if (!window.jspdf || !window.jspdf.jsPDF || !window.jspdf.jsPDF.API || !window.jspdf.jsPDF.API.autoTable) {
                        throw new Error("PDF library unavailable");
                    }
                });

            return this._pPdfLibraryLoad;
        },

        _loadScriptOnce: function (sUrl) {
            if (document.querySelector('script[data-pdf-lib-url="' + sUrl + '"]')) {
                return Promise.resolve();
            }

            return new Promise(function (resolve, reject) {
                var oScript = document.createElement("script");

                oScript.async = true;
                oScript.src = sUrl;
                oScript.setAttribute("data-pdf-lib-url", sUrl);
                oScript.onload = function () {
                    resolve();
                };
                oScript.onerror = function () {
                    reject(new Error("Unable to load script: " + sUrl));
                };

                document.head.appendChild(oScript);
            });
        },

        _buildSingleFacturePdf: function (oDoc, oFacture) {
            this._decoratePdfPage(oDoc, "Facture", "Fiche detaillee");

            oDoc.autoTable({
                startY: 34,
                theme: "grid",
                tableWidth: "auto",
                margin: { left: 12, right: 12 },
                head: [["Champ", "Valeur"]],
                body: this._getFacturePdfRows(oFacture),
                styles: {
                    font: "helvetica",
                    fontSize: 10,
                    cellPadding: 3,
                    textColor: [31, 41, 55],
                    lineColor: [229, 231, 235],
                    lineWidth: 0.2,
                    overflow: "linebreak",
                    valign: "middle"
                },
                headStyles: {
                    fillColor: [17, 24, 39],
                    textColor: 255,
                    fontStyle: "bold"
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251]
                },
                columnStyles: {
                    0: {
                        cellWidth: 48,
                        fillColor: [243, 244, 246],
                        textColor: [55, 65, 81],
                        fontStyle: "bold"
                    },
                    1: {
                        cellWidth: "auto"
                    }
                },
                didDrawPage: function (oData) {
                    this._drawPdfFooter(oDoc, oData.pageNumber);
                }.bind(this)
            });
        },

        _buildFacturesPdf: function (oDoc, aFactures) {
            var aBody = aFactures.map(function (oFacture) {
                return [
                    this._formatPdfCell(oFacture.Id),
                    this._formatPdfCell(oFacture.Clientfullname),
                    this._formatPdfCell(formatter.formatAmount(oFacture.Amount)),
                    this._formatPdfCell(oFacture.Devise),
                    this._formatPdfCell(oFacture.Voitureid),
                    this._formatPdfCell(oFacture.Createdby),
                    this._formatPdfCell(formatter.formatDateTime(oFacture.Createdat)),
                    this._formatPdfCell(oFacture.Counter)
                ];
            }.bind(this));
            var fTotal = aFactures.reduce(function (fSum, oFacture) {
                var fAmount = Number(String(oFacture.Amount).replace(",", "."));

                return fSum + (Number.isNaN(fAmount) ? 0 : fAmount);
            }, 0);

            this._decoratePdfPage(oDoc, "Factures", "Liste exportee");
            oDoc.setFont("helvetica", "normal");
            oDoc.setFontSize(10);
            oDoc.setTextColor(75, 85, 99);
            oDoc.text("Nombre de factures: " + aFactures.length + "    Total: " + formatter.formatAmount(fTotal), 12, 31);

            oDoc.autoTable({
                startY: 36,
                theme: "grid",
                margin: { left: 8, right: 8 },
                head: [["Id", "Client", "Montant", "Devise", "Voiture", "Cree par", "Cree le", "Compteur"]],
                body: aBody,
                styles: {
                    font: "helvetica",
                    fontSize: 8,
                    cellPadding: 2,
                    textColor: [31, 41, 55],
                    lineColor: [229, 231, 235],
                    lineWidth: 0.2,
                    overflow: "linebreak",
                    valign: "middle"
                },
                headStyles: {
                    fillColor: [17, 24, 39],
                    textColor: 255,
                    fontStyle: "bold"
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                },
                columnStyles: {
                    0: { cellWidth: 24 },
                    1: { cellWidth: 34 },
                    2: { halign: "right", cellWidth: 20 },
                    3: { cellWidth: 18 },
                    4: { cellWidth: 28 },
                    5: { cellWidth: 26 },
                    6: { cellWidth: 28 },
                    7: { halign: "center", cellWidth: 16 }
                },
                didDrawPage: function (oData) {
                    this._drawPdfFooter(oDoc, oData.pageNumber);
                }.bind(this)
            });
        },

        _getFacturePdfRows: function (oFacture) {
            return [
                ["Id", this._formatPdfCell(oFacture && oFacture.Id)],
                ["Client ID", this._formatPdfCell(oFacture && oFacture.Clientid)],
                ["Nom complet", this._formatPdfCell(oFacture && oFacture.Clientfullname)],
                ["Voiture ID", this._formatPdfCell(oFacture && oFacture.Voitureid)],
                ["Montant", this._formatPdfCell(formatter.formatAmount(oFacture && oFacture.Amount))],
                ["Devise", this._formatPdfCell(oFacture && oFacture.Devise)],
                ["Cree par", this._formatPdfCell(oFacture && oFacture.Createdby)],
                ["Cree le", this._formatPdfCell(formatter.formatDateTime(oFacture && oFacture.Createdat))],
                ["Compteur", this._formatPdfCell(oFacture && oFacture.Counter)]
            ];
        },

        _createPdfDocument: function () {
            var JsPdf = window.jspdf && window.jspdf.jsPDF;

            if (!JsPdf) {
                return null;
            }

            return new JsPdf({
                orientation: "p",
                unit: "mm",
                format: "a4",
                compress: true
            });
        },

        _buildFacturePdfFileName: function (oFacture) {
            var sId = this._normalizePdfText(oFacture && oFacture.Id ? String(oFacture.Id) : "facture");
            var sSafeId = sId.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");

            return (sSafeId || "facture") + ".pdf";
        },

        _buildFacturesPdfFileName: function (aFactures) {
            return "factures_" + String((aFactures || []).length || 0) + ".pdf";
        },

        _decoratePdfPage: function (oDoc, sTitle, sSubtitle) {
            oDoc.setFillColor(17, 24, 39);
            oDoc.rect(0, 0, 210, 24, "F");
            oDoc.setTextColor(255, 255, 255);
            oDoc.setFont("helvetica", "bold");
            oDoc.setFontSize(18);
            oDoc.text(sTitle || "Facture", 12, 10);
            oDoc.setFont("helvetica", "normal");
            oDoc.setFontSize(9);
            oDoc.text(sSubtitle || "", 12, 16);
            oDoc.setTextColor(31, 41, 55);
        },

        _drawPdfFooter: function (oDoc, iPageNumber) {
            var iPageWidth = oDoc.internal.pageSize.getWidth();
            var iPageHeight = oDoc.internal.pageSize.getHeight();

            oDoc.setDrawColor(229, 231, 235);
            oDoc.line(12, iPageHeight - 12, iPageWidth - 12, iPageHeight - 12);
            oDoc.setFont("helvetica", "normal");
            oDoc.setFontSize(8);
            oDoc.setTextColor(107, 114, 128);
            oDoc.text("Page " + iPageNumber, iPageWidth - 12, iPageHeight - 6, { align: "right" });
        },

        _formatPdfCell: function (vValue) {
            var sValue = vValue === null || vValue === undefined ? "" : String(vValue);

            return this._normalizePdfText(sValue);
        },

        _normalizePdfText: function (sText) {
            var sValue = String(sText || "");

            if (sValue.normalize) {
                sValue = sValue.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }

            return sValue.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");
        }
    });
});