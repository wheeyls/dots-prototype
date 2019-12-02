// @format
class DataBrowser {
  constructor({ products, questions, businessStats, categories, aggregates }) {
    this.products = products;
    this.questions = questions;
    this.businessStats = businessStats;
    this.categories = categories;
    this.aggregates = aggregates;

    this.id = Math.floor(Math.random() * 1000000);
  }

  productFor(aggregate) {
    return this.products.find(p => p.id === aggregate.product_id);
  }

  filtered(filters) {
    const aggregates = this.filter(filters);
    const question_ids = Array.from(
      new Set(aggregates.map(i => i.question_id))
    );
    const questions = this.questions.filter(i => question_ids.includes(i.id));
    return this.clone({ aggregates, questions });
  }

  filter(filters) {
    return this.aggregates.filter(aggregate =>
      Object.entries(filters).every(([k, v]) => aggregate[k] === v)
    );
  }

  perQuestion() {
    return this.questionIds().map(id => this.filtered({ question_id: id }));
  }

  perProduct() {
    return this.products.map(product => {
      const r = this.filtered({ product_id: product.id });
      r.selectedProduct = product;
      return r;
    });
  }

  intersection() {
    const [leftProduct, rightProduct] = this.perProduct();

    return this.aggregates.filter(
      aggregate =>
        leftProduct.aggregates.find(
          i => i.question_id === aggregate.question_id
        ) &&
        rightProduct.aggregates.find(
          i => i.question_id === aggregate.question_id
        )
    );
  }

  groups() {
    const browsers = this.perProduct();
    return this.questions
      .map(question => {
        const aggregates = browsers.map(b =>
          b.aggregates.find(i => i.question_id === question.id)
        );
        return [question].concat(aggregates);
      })
      .map(([question, ...aggregates]) => {
        const normals = aggregates.map(a => {
          if (a) {
            return a.average / (a.max || 10);
          }
        });

        const [diff, sort] = DataBrowser.computeDiff(
          normals,
          question.smaller_is_better
        );

        return {
          question,
          aggregates,
          normals,
          diff: diff,
          sort: sort,
          id: question.id
        };
      })
      .sort((a, b) => {
        return b.sort - a.sort;
      });
  }

  static computeDiff(array, smallerIsBetter) {
    const first = array[0] || 0;

    const diffs = array
      .filter((current, idx) => {
        return idx === 0 || current != null;
      })
      .reduce((memo, current, idx) => {
        if (idx === 0) {
          return memo;
        }

        if (smallerIsBetter) {
          memo.push(current - first);
        } else {
          memo.push(first - current);
        }

        return memo;
      }, []);

    let modifier = 0;
    if (array[0] == null) {
      modifier = 100; // main missing
    } else if (array.length - 1 === diffs.length) {
      modifier = 400; // all
    } else if (array[0] != null && diffs.length > 0) {
      modifier = 300; // main, + partial others
    } else if (array[0] != null) {
      modifier = 200; // main only
    }

    if (diffs.length > 0) {
      return [Math.min(...diffs), Math.min(...diffs) + modifier];
    } else {
      return [0, first + modifier];
    }
  }

  questionIds() {
    return this.questions.map(i => i.id);
  }

  clone({
    products = this.products,
    questions = this.questions,
    businessStats = this.businessStats,
    categories = this.categories,
    aggregates = this.aggregates
  }) {
    return new DataBrowser({
      products,
      questions,
      businessStats,
      categories,
      aggregates
    });
  }

  productName(id) {
    if (id === this.products.left.id) {
      return this.products.left.name;
    }

    if (id === this.products.right.id) {
      return this.products.right.name;
    }
  }

  questionName(id) {
    const question = this.questions.find(i => i.id === id);
    return question ? question.text_template : null;
  }

  categoryName(id) {
    const category = this.categories.find(i => i.id === id);
    return category ? category.name : null;
  }
}

export { DataBrowser };
