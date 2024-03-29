module.exports = {
  filterResponse: async (req, res, next) => {
    try {
      // grab API key from node env variables, deconstruct formId, and define filters
      const apiKey = process.env.API_KEY;
      const { formId } = req.params;
      const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
      
      // reformat filters into a reference object to avoid having to iterate through filters array (assumes unique IDs for all questions)
      const filterObj = filters.reduce((acc, cv) => (
        acc[cv.id] = {'value': cv.value, 'condition': cv.condition }, acc
      ), {})

      // return an error if the formId is not provided
      if (!formId) {
        return next({
          log: 'Error in filterController.filterResponse, client did not provide a form Id',
          message: 'Unable to get responses, no formId provided',
        });
      }

      // fetch submissions
      const formData = await fetch(
        `https://api.fillout.com/v1/api/forms/${formId}/submissions`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );

      // parse submission data
      const formDataParsed = await formData.json();

      // store page count in a constant to use in response
      const pageCount = formDataParsed.pageCount;

      // filter submission data using requested filters
      const filter = (submissions) => {
        if (!filters.length) return submissions;
        const results = [];

        submissions.forEach((submission) => {
          let passes = true;
          submission.questions.forEach((question) => {
            if (filterObj[question.id]) {
              const filter = filterObj[question.id];
              if (
                filter.condition === 'greater_than' &&
                filter.value >= question.value
              ) {
                passes = false;
              } else if (
                filter.condition === 'less_than' &&
                filter.value <= question.value
              ) {
                passes = false;
              } else if (
                filter.condition === 'equals' &&
                filter.value !== question.value
              ) {
                passes = false;
              } else if (
                filter.condition === 'does_not_equal' &&
                filter.value === question.value
              ) {
                passes = false;
              }
            }
          });
          if (passes) {
            results.push(submission);
          }
        });
        return results;
      };
      
      const filteredData = filter(formDataParsed.responses);

      const response = {
        reponses: filteredData,
        totalResponses: filteredData.length,
        pageCount: pageCount,
      };

      res.locals.data = response;
      return next();

    } catch (err) {
      return next({
        log: 'Error in filterController.filterResponse',
        message: 'Error getting survey responses'
      });
    }
  },
};
