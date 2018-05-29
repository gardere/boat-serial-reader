const filters = {
    "moving-average": require("./moving-average")
};

module.exports = filters;

const maFilter = filters["moving-average"]({
    "number-of-values": 4
});