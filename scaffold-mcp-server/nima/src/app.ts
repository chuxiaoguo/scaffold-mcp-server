export const dva = {
  config: {
    onError(err: any) {
      err.preventDefault();
      console.error(err.message);
    },
  },
};

export const request = {
  timeout: 1000,
  errorConfig: {
    errorThrower: (res: any) => {
      const { success, data, errorCode, errorMessage, showMessage } = res;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showMessage, data };
        throw error;
      }
    },
  },
};
