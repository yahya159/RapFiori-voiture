sap.ui.define([], function () {
    "use strict";

    function toDate(value) {
        if (!value) {
            return null;
        }

        if (value instanceof Date) {
            return value;
        }

        if (typeof value === "string") {
            const match = /\/Date\((\d+)\)\//.exec(value);

            if (match) {
                return new Date(Number(match[1]));
            }

            const parsed = new Date(value);

            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        return null;
    }

    const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    const numberFormatter = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return {
        formatDate(value) {
            const date = toDate(value);

            return date ? dateFormatter.format(date) : "";
        },

        formatDateTime(value) {
            const date = toDate(value);

            return date ? dateTimeFormatter.format(date) : "";
        },

        formatAmount(value) {
            if (value === null || value === undefined || value === "") {
                return "";
            }

            const amount = Number(value);

            return Number.isNaN(amount) ? "" : numberFormatter.format(amount);
        },

        formatText(value) {
            return value || "";
        }
    };
});