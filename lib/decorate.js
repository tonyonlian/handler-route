exports.err = {
  decorate: 'reply',
  method: function (info) {
    return this.response({
      err_info:info,
      err_no: -1
    });
  }
};


exports.data = {
  decorate: 'reply',
  method: function (info) {
    return this.response({
      data:info,
      err_no: 1
    });
  }
};