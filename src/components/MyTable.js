/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";
import PropTypes from "prop-types";
import { Bar } from "react-chartjs-2";
import moment from "moment";

import { DataContext } from "../utils/DataContext";

function intersect(a, b) {
    return a.filter(Set.prototype.has, new Set(b));
}
const difference = (a, b) => a.filter((x) => !b.has(x));

const MyTable = (props) => {
    // In this case, data could've been passed via props from the <MainComponent>,
    // but in a larger example, it can be helpful to use the Context API to load
    // data in multiple components without prop drilling.

    // DataContext was populated by the <DataProvider> in index.js
    const { value: data } = React.useContext(DataContext);

    const { fields, tables, style } = data;
    const allFields = fields.dimID.concat(fields.metricID);

    // Use default value as an initial backup
    const cellBackgroundColor =
        style.cellBackgroundColor.value ||
        style.cellBackgroundColor.defaultValue;

    const tableStyle = css`
        padding: 10px;
        background: ${cellBackgroundColor.color};
    `;

    const getRow = (tableRow) => {
        const allColumns = tableRow.dimID.concat(tableRow.metricID);
        return (
            <>
                {allColumns.map((x, i) => (
                    <td css={tableStyle} key={i}>
                        {x}
                    </td>
                ))}
                {<td css={tableStyle}>{dateFormat(allColumns[1])}</td>}
            </>
        );
    };
    const months = tables.DEFAULT.map((row, i) => row.dimID[1]);

    const uniqueMonths = new Set(months);

    const moments = Array.from(uniqueMonths).map((month) => moment(month));

    // got all sorted months
    moments.sort((left, right) => left.diff(right));

    // need an object that contains number of users that were not in the previosu month
    // or how were there in previosu month

    let retention = [];

    const retentionObject = moments.map((momentdate, index) => {
        const stringMoment = momentdate.format("YYYYMMDD");
        const previousMonth = moment(momentdate)
            .subtract(1, "months")
            .format("YYYYMMDD");

        let thisMonthPeople = tables.DEFAULT.filter(
            (row, i) => row.dimID[1] === stringMoment
        ).map((row) => row.dimID[0]);

        if (index === 0) {
            retention = JSON.parse(JSON.stringify(thisMonthPeople));
            return {
                newUsersThisMonth: thisMonthPeople.length,
                ConsistentForTwoMonths: 0,
                retentionUsers: thisMonthPeople.length,
            };
        }

        // consistent for two months

        let previousMonthPeople = tables.DEFAULT.filter(
            (row, i) => row.dimID[1] === previousMonth
        ).map((row) => row.dimID[0]);

        const consistency = intersect(thisMonthPeople, previousMonthPeople);

        const newUsers = difference(thisMonthPeople, new Set(consistency));

        retention = intersect(retention, thisMonthPeople);

        return {
            newUsersThisMonth: newUsers.length,
            ConsistentForTwoMonths: consistency.length,
            retentionUsers: retention.length,
        };
    });

    const dataBarChart = {
        labels: moments.map((dates) => dates.format("MMM YYYY")),
        datasets: [
            {
                label: "Users consistent for two months",
                data: retentionObject.map(
                    (retention) => retention.ConsistentForTwoMonths
                ),
                backgroundColor: "rgb(229, 32, 39)",
                stack: "Stack 0",
            },
            {
                label: "Users active this month",
                data: retentionObject.map(
                    (retention) => retention.newUsersThisMonth
                ),
                backgroundColor: "rgb(241, 129, 133)",
                stack: "Stack 1",
            },
            {
                label: "Consistent users",
                data: retentionObject.map(
                    (retention) => retention.retentionUsers
                ),
                backgroundColor: "rgb(255, 207, 209)",
                stack: "Stack 2",
            },
        ],
    };

    const options = {
        scales: {
            y: {
                ticks: {
                    beginAtZero: true,
                },
                grid: {
                    display: false,
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div>
            <Bar data={dataBarChart} options={options} />
        </div>
    );
};

MyTable.propTypes = {};

export default MyTable;
