exports.Err = {
  decorate: 'reply',
  method: function (info) {
    return this.response({
      err_info:info,
      err_no: -1
    });
  }
};


exports.Data = {
  decorate: 'reply',
  method: function (info) {
    return this.response({
      data:info,
      err_no: 1
    });
  }
};